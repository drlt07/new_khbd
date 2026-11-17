import "server-only";
import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { suggestTask, type Phase } from "@/lib/lesson/template";
import { adjustTask, createMaterial, generateLesson, suggestActivityTasks, type ProfileForAI } from "@/server/ai/lesson.ai";
import type { AssistInput, LessonCreate, LessonSave } from "@/schemas/lesson";
import { assertSessionOwner } from "./session.service";
import { log } from "./log.service";

export async function assertLessonOwner(userId: string, id: string) {
  const l = await prisma.lessonPlan.findFirst({ where: { id, session: { class: { ownerId: userId } } }, include: { session: true } });
  if (!l) throw new ApiError(404, "Không tìm thấy kế hoạch bài dạy");
  return l;
}

async function profiles(sessionId: string): Promise<ProfileForAI[]> {
  const gs = await prisma.groupProfile.findMany({ where: { sessionId }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { members: true } } } });
  return gs.map((g) => ({
    id: g.id, name: g.name, profile: g.description, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport,
    avgScore: g.avgScore, competency: g.competency, strengths: g.strengths, difficulties: g.difficulties, needs: g.needs, supportGoal: g.supportGoal, size: g._count.members,
  }));
}

/** Phiên bản đã duyệt mới nhất cùng bộ nhóm (nếu khác phiên KHBD đang dùng => KHBD lỗi thời) */
async function latestConfirmed(lineageId: string) {
  return prisma.groupingSession.findFirst({ where: { lineageId, status: "CONFIRMED" }, orderBy: { version: "desc" }, select: { id: true, version: true } });
}

export async function createLesson(userId: string, input: LessonCreate) {
  const s = await assertSessionOwner(userId, input.sessionId);
  if (s.status !== "CONFIRMED") throw new ApiError(422, "Chỉ dùng hồ sơ nhóm đã được giáo viên duyệt (Pha 1, bước 4)");
  const l = await prisma.lessonPlan.create({ data: input });
  await log(userId, s.classId, "lesson.create", `Tạo KHBD “${l.title}” từ hồ sơ nhóm “${s.title}” v${s.version}`, `/phase2/${l.id}`);
  return l;
}

/** Tạo tiến trình chung + nhiệm vụ phân hóa (AI hoặc quy tắc). Ghi đè tiến trình hiện có. */
export async function generate(userId: string, id: string) {
  const l = await assertLessonOwner(userId, id);
  const groups = await profiles(l.sessionId);
  const out = await generateLesson({ subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements, content: l.content, methods: l.methods }, groups);
  await prisma.$transaction(async (tx) => {
    await tx.lessonActivity.deleteMany({ where: { lessonPlanId: id } });
    await tx.lessonPlan.update({
      where: { id },
      data: {
        engine: out.engine,
        knowledgeGoals: l.knowledgeGoals ?? out.goals.knowledgeGoals, competencyGoals: l.competencyGoals ?? out.goals.competencyGoals,
        qualityGoals: l.qualityGoals ?? out.goals.qualityGoals, materials: l.materials ?? out.goals.materials, assessment: l.assessment ?? out.goals.assessment,
      },
    });
    for (const [i, a] of out.activities.entries()) {
      await tx.lessonActivity.create({
        data: {
          lessonPlanId: id, sortOrder: i, phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup,
          tasks: { create: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support, materials: t.materials, challenge: t.challenge, assessment: t.assessment })) },
        },
      });
    }
  });
  await log(userId, l.session.classId, "lesson.generate", `Tạo tiến trình & nhiệm vụ phân hóa cho “${l.title}”`, `/phase2/${id}`);
  return { engine: out.engine, note: out.note };
}

export async function listLessons(userId: string, filter: { classId?: string; status?: "DRAFT" | "REVIEW" | "DONE" } = {}) {
  const rows = await prisma.lessonPlan.findMany({
    where: { session: { class: { ownerId: userId }, ...(filter.classId ? { classId: filter.classId } : {}) }, ...(filter.status ? { status: filter.status } : {}) },
    orderBy: { updatedAt: "desc" },
    include: { session: { select: { id: true, title: true, version: true, status: true, lineageId: true, class: { select: { id: true, name: true } }, _count: { select: { groups: true } } } }, _count: { select: { activities: true } } },
  });
  return rows.map((r) => ({ ...r, outdated: r.session.status === "SUPERSEDED" }));
}

export async function getLesson(userId: string, id: string) {
  await assertLessonOwner(userId, id);
  const l = await prisma.lessonPlan.findUniqueOrThrow({
    where: { id },
    include: {
      activities: { orderBy: { sortOrder: "asc" }, include: { tasks: true } },
      session: { include: { class: { select: { id: true, name: true, schoolYear: true } }, groups: { orderBy: { sortOrder: "asc" }, include: { members: { include: { student: { select: { fullName: true } } } } } } } },
    },
  });
  const latest = l.session.status === "SUPERSEDED" ? await latestConfirmed(l.session.lineageId) : null;
  return { ...l, latest };
}
export type LessonDetail = Awaited<ReturnType<typeof getLesson>>;

export async function saveLesson(userId: string, id: string, input: LessonSave) {
  const l = await assertLessonOwner(userId, id);
  const groupIds = new Set((await prisma.groupProfile.findMany({ where: { sessionId: l.sessionId }, select: { id: true } })).map((g) => g.id));
  if (!input.activities.every((a) => a.tasks.every((t) => groupIds.has(t.groupId)))) throw new ApiError(422, "Nhiệm vụ gắn với nhóm không thuộc hồ sơ nhóm của KHBD");
  const { activities, ...data } = input;
  await prisma.$transaction(async (tx) => {
    await tx.lessonPlan.update({ where: { id }, data });
    await tx.lessonActivity.deleteMany({ where: { lessonPlanId: id } });
    for (const [i, a] of activities.entries()) {
      const { tasks, ...rest } = a;
      await tx.lessonActivity.create({ data: { ...rest, lessonPlanId: id, sortOrder: i, tasks: { create: a.byGroup ? tasks.filter((t) => t.task) : [] } } });
    }
  });
  if (input.status !== l.status) await log(userId, l.session.classId, "lesson.status", `KHBD “${input.title}” chuyển sang ${input.status === "DONE" ? "Hoàn thành" : input.status === "REVIEW" ? "Chờ duyệt" : "Bản nháp"}`, `/phase2/${id}`);
}

/**
 * Cập nhật KHBD sang phiên bản hồ sơ nhóm mới nhất: nhiệm vụ được chuyển theo slotKey của nhóm;
 * nhóm mới được gợi ý nhiệm vụ; nhiệm vụ của nhóm đã bị xóa được bỏ.
 */
export async function upgradeToLatest(userId: string, id: string) {
  const l = await assertLessonOwner(userId, id);
  const latest = await latestConfirmed(l.session.lineageId);
  if (!latest || latest.id === l.sessionId) throw new ApiError(409, "KHBD đang dùng phiên bản hồ sơ nhóm mới nhất");
  const [oldGroups, newGroups, acts] = await Promise.all([
    prisma.groupProfile.findMany({ where: { sessionId: l.sessionId } }),
    profiles(latest.id),
    prisma.lessonActivity.findMany({ where: { lessonPlanId: id }, include: { tasks: true } }),
  ]);
  const newSlots = await prisma.groupProfile.findMany({ where: { sessionId: latest.id }, select: { id: true, slotKey: true } });
  const slotOf = new Map(oldGroups.map((g) => [g.id, g.slotKey]));
  const newBySlot = new Map(newSlots.map((g) => [g.slotKey, g.id]));
  let mapped = 0, added = 0, removed = 0;
  const lessonCtx = { subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements };
  await prisma.$transaction(async (tx) => {
    for (const a of acts) {
      const kept = new Set<string>();
      for (const t of a.tasks) {
        const target = newBySlot.get(slotOf.get(t.groupId) ?? "");
        if (target) { await tx.groupTask.update({ where: { id: t.id }, data: { groupId: target } }); kept.add(target); mapped++; }
        else { await tx.groupTask.delete({ where: { id: t.id } }); removed++; }
      }
      if (a.byGroup && a.phase !== "OPENING")
        for (const g of newGroups.filter((x) => !kept.has(x.id))) {
          const s = suggestTask(a.phase as Exclude<Phase, "OPENING">, lessonCtx, g);
          await tx.groupTask.create({ data: { activityId: a.id, groupId: g.id, task: s.task, product: s.product, support: s.support, materials: s.materials, challenge: s.challenge, assessment: s.assessment } });
          added++;
        }
    }
    await tx.lessonPlan.update({ where: { id }, data: { sessionId: latest.id } });
  });
  await log(userId, l.session.classId, "lesson.upgrade", `Cập nhật KHBD “${l.title}” sang hồ sơ nhóm v${latest.version}`, `/phase2/${id}`);
  return { version: latest.version, mapped, added, removed };
}

export async function assist(userId: string, id: string, input: AssistInput) {
  const l = await assertLessonOwner(userId, id);
  const groups = await profiles(l.sessionId);
  const lesson = { ...input.lesson, content: input.lesson.content ?? null, methods: input.lesson.methods ?? null, requirements: input.lesson.requirements ?? null };
  if (input.action === "suggest") {
    const target = input.groupId ? groups.filter((g) => g.id === input.groupId) : groups;
    return suggestActivityTasks(lesson, input.phase, input.activityTitle, target);
  }
  const g = groups.find((x) => x.id === input.groupId);
  if (!g || !input.task) throw new ApiError(422, "Chọn nhiệm vụ của một nhóm");
  const t = { ...input.task, product: input.task.product ?? null, support: input.task.support ?? null, materials: input.task.materials ?? null, challenge: input.task.challenge ?? null, assessment: input.task.assessment ?? null };
  if (input.action === "material") return createMaterial(lesson, g, t);
  return adjustTask(lesson, g, t, input.action === "easier" ? "easier" : "harder");
}

export async function deleteLesson(userId: string, id: string) {
  const l = await assertLessonOwner(userId, id);
  await prisma.lessonPlan.delete({ where: { id } });
  await log(userId, l.session.classId, "lesson.delete", `Xóa KHBD “${l.title}”`);
}

export async function duplicateLesson(userId: string, id: string) {
  const l = await getLesson(userId, id);
  const copy = await prisma.lessonPlan.create({
    data: {
      sessionId: l.sessionId, subject: l.subject, title: `${l.title} (bản sao)`, periods: l.periods, requirements: l.requirements, content: l.content, methods: l.methods,
      knowledgeGoals: l.knowledgeGoals, competencyGoals: l.competencyGoals, qualityGoals: l.qualityGoals, materials: l.materials, assessment: l.assessment, engine: l.engine,
      activities: { create: l.activities.map((a, i) => ({ phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup, sortOrder: i,
        tasks: { create: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support, materials: t.materials, challenge: t.challenge, assessment: t.assessment })) } })) },
    },
  });
  await log(userId, l.session.classId, "lesson.duplicate", `Nhân bản KHBD “${l.title}”`, `/phase2/${copy.id}`);
  return copy;
}

// ─────────────────────────── Xuất Word ───────────────────────────

const lines = (s: string | null | undefined) => (s ?? "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
const p = (text: string, opts: { bold?: boolean; italics?: boolean; indent?: boolean } = {}) =>
  new Paragraph({ spacing: { after: 80 }, indent: opts.indent ? { left: 360 } : undefined, children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })] });
const labeled = (label: string, value: string | null | undefined) => [
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: label, bold: true })] }),
  ...(lines(value).length ? lines(value).map((x) => p(x, { indent: true })) : [p("(chưa nhập)", { italics: true, indent: true })]),
];
const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const cell = (text: string, bold = false, width?: number) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  borders: { top: border, bottom: border, left: border, right: border },
  children: lines(text).length ? lines(text).map((t) => new Paragraph({ children: [new TextRun({ text: t, bold, size: 21 })] })) : [new Paragraph("")],
});
const h1 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240 }, children: [new TextRun({ text: t, bold: true })] });

export async function exportLessonDocx(userId: string, id: string) {
  const l = await getLesson(userId, id);
  const groups = l.session.groups;
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const children: (Paragraph | Table)[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KẾ HOẠCH BÀI DẠY", bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: l.title.toUpperCase(), bold: true, size: 28 })] }),
    p(`Môn: ${l.subject} · Lớp: ${l.session.class.name} · Năm học ${l.session.class.schoolYear} · Thời lượng: ${l.periods} tiết`),
    p(`Hồ sơ nhóm: ${l.session.title} (phiên bản ${l.session.version}, ${groups.length} nhóm)`, { italics: true }),
    h1("I. MỤC TIÊU"), ...labeled("Yêu cầu cần đạt:", l.requirements), ...labeled("1. Kiến thức:", l.knowledgeGoals), ...labeled("2. Năng lực:", l.competencyGoals), ...labeled("3. Phẩm chất:", l.qualityGoals),
    h1("II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU"), ...(lines(l.materials).length ? lines(l.materials).map((x) => p(`- ${x}`)) : [p("(chưa nhập)", { italics: true })]),
    h1("III. TIẾN TRÌNH DẠY HỌC"),
  ];
  for (const a of l.activities) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200 }, children: [new TextRun({ text: `${a.title}${a.minutes ? ` (${a.minutes} phút)` : ""}`, bold: true })] }));
    children.push(...labeled("a) Mục tiêu:", a.goal), ...labeled("b) Nội dung:", a.content), ...labeled("c) Sản phẩm:", a.product), ...labeled("d) Tổ chức thực hiện:", a.organization));
    const ordered = groups.map((g) => a.tasks.find((t) => t.groupId === g.id)).filter((t): t is NonNullable<typeof t> => !!t);
    if (a.byGroup && ordered.length) {
      children.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Nhiệm vụ phân hóa theo nhóm:", bold: true })] }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
        new TableRow({ tableHeader: true, children: [cell("Nhóm", true, 13), cell("Nhiệm vụ", true, 30), cell("Mức thử thách", true, 12), cell("Học liệu", true, 15), cell("Sản phẩm", true, 13), cell("Hỗ trợ / Đánh giá", true, 17)] }),
        ...ordered.map((t) => new TableRow({ children: [cell(gName.get(t.groupId) ?? ""), cell(t.task), cell(t.challenge ?? ""), cell(t.materials ?? ""), cell(t.product ?? ""), cell([t.support, t.assessment && `Đánh giá: ${t.assessment}`].filter(Boolean).join("\n"))] })),
      ] }));
    }
  }
  children.push(h1("IV. ĐÁNH GIÁ"), ...(lines(l.assessment).length ? lines(l.assessment).map((x) => p(x)) : [p("(chưa nhập)", { italics: true })]),
    h1("PHỤ LỤC: HỒ SƠ NHÓM HỌC TẬP"),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ tableHeader: true, children: [cell("Nhóm", true, 14), cell("Đặc trưng năng lực", true, 26), cell("Nhu cầu & mục tiêu hỗ trợ", true, 26), cell("Thành viên", true, 34)] }),
      ...groups.map((g) => new TableRow({ children: [cell(g.name), cell([g.competency, g.strengths.length && `Điểm mạnh: ${g.strengths.join(", ")}`, g.difficulties.length && `Khó khăn: ${g.difficulties.join(", ")}`].filter(Boolean).join("\n")), cell([g.needs, g.supportGoal && `Mục tiêu: ${g.supportGoal}`].filter(Boolean).join("\n")), cell(g.members.map((m) => m.student.fullName).join(", "))] })),
    ] }));
  const doc = new Document({ styles: { default: { document: { run: { font: "Times New Roman", size: 26 } } } }, sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
