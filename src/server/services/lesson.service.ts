import "server-only";
import { AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { buildLessonDraft, PHASE_LABEL } from "@/lib/lesson/template";
import type { LessonCreate, LessonSave } from "@/schemas/lesson";
import { assertGroupingOwner, assertLessonOwner } from "./authz";
import { groupCriteriaText } from "./grouping.service";

export async function createLesson(userId: string, input: LessonCreate) {
  await assertGroupingOwner(userId, input.groupingId);
  const groups = await prisma.group.findMany({ where: { groupingId: input.groupingId }, orderBy: { sortOrder: "asc" } });
  if (!groups.length) throw new ApiError(422, "Bộ nhóm chưa có nhóm nào");
  const draft = buildLessonDraft({ subject: input.subject, title: input.title, periods: input.periods, requirements: input.requirements ?? null }, groups);
  return prisma.lessonPlan.create({
    data: {
      ...input,
      activities: {
        create: draft.map((a, i) => ({
          phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product,
          organization: a.organization, byGroup: a.byGroup, sortOrder: i,
          tasks: { create: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support })) },
        })),
      },
    },
  });
}

export async function listLessons(userId: string, classId?: string) {
  return prisma.lessonPlan.findMany({
    where: { grouping: { class: { ownerId: userId }, ...(classId ? { classId } : {}) } },
    orderBy: { updatedAt: "desc" },
    include: { grouping: { select: { id: true, title: true, class: { select: { id: true, name: true } }, _count: { select: { groups: true } } } } },
  });
}

export async function getLesson(userId: string, id: string) {
  await assertLessonOwner(userId, id);
  return prisma.lessonPlan.findUniqueOrThrow({
    where: { id },
    include: {
      activities: { orderBy: { sortOrder: "asc" }, include: { tasks: true } },
      grouping: {
        include: {
          class: { select: { id: true, name: true, schoolYear: true } },
          groups: { orderBy: { sortOrder: "asc" }, include: { members: { include: { student: { select: { fullName: true } } } } } },
        },
      },
    },
  });
}
export type LessonDetail = Awaited<ReturnType<typeof getLesson>>;

export async function saveLesson(userId: string, id: string, input: LessonSave) {
  const l = await assertLessonOwner(userId, id);
  const groupIds = new Set((await prisma.group.findMany({ where: { groupingId: l.groupingId }, select: { id: true } })).map((g) => g.id));
  if (!input.activities.every((a) => a.tasks.every((t) => groupIds.has(t.groupId)))) throw new ApiError(422, "Nhiệm vụ gắn với nhóm không thuộc bộ nhóm của KHBD");
  const { activities, ...data } = input;
  await prisma.$transaction(async (tx) => {
    await tx.lessonPlan.update({ where: { id }, data });
    await tx.lessonActivity.deleteMany({ where: { lessonPlanId: id } });
    for (const [i, a] of activities.entries()) {
      const { tasks, ...rest } = a;
      await tx.lessonActivity.create({
        data: { ...rest, lessonPlanId: id, sortOrder: i, tasks: { create: a.byGroup ? tasks.filter((t) => t.task).map((t) => ({ ...t })) : [] } },
      });
    }
  });
}

export async function deleteLesson(userId: string, id: string) {
  await assertLessonOwner(userId, id);
  await prisma.lessonPlan.delete({ where: { id } });
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
const cell = (text: string, bold = false, width?: number) =>
  new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    children: lines(text).length ? lines(text).map((t) => new Paragraph({ children: [new TextRun({ text: t, bold, size: 22 })] })) : [new Paragraph("")],
  });

export async function exportLessonDocx(userId: string, id: string) {
  const l = await getLesson(userId, id);
  const groups = l.grouping.groups;
  const gName = new Map(groups.map((g) => [g.id, g.name]));
  const members = (gid: string) => groups.find((g) => g.id === gid)?.members.map((m) => m.student.fullName).join(", ") ?? "";

  const children: (Paragraph | Table)[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.TITLE, children: [new TextRun({ text: "KẾ HOẠCH BÀI DẠY", bold: true, size: 32 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `${l.title.toUpperCase()}`, bold: true, size: 28 })] }),
    p(`Môn: ${l.subject} · Lớp: ${l.grouping.class.name} · Năm học ${l.grouping.class.schoolYear} · Thời lượng: ${l.periods} tiết`),
    p(`Bộ nhóm sử dụng: ${l.grouping.title} (${groups.length} nhóm)`, { italics: true }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "I. MỤC TIÊU", bold: true })] }),
    ...labeled("Yêu cầu cần đạt:", l.requirements),
    ...labeled("1. Kiến thức:", l.knowledgeGoals),
    ...labeled("2. Năng lực:", l.competencyGoals),
    ...labeled("3. Phẩm chất:", l.qualityGoals),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU", bold: true })] }),
    ...(lines(l.materials).length ? lines(l.materials).map((x) => p(`- ${x}`)) : [p("(chưa nhập)", { italics: true })]),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "III. TIẾN TRÌNH DẠY HỌC", bold: true })] }),
  ];

  for (const a of l.activities) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200 }, children: [new TextRun({ text: `${a.title}${a.minutes ? ` (${a.minutes} phút)` : ""}`, bold: true })] }));
    children.push(...labeled("a) Mục tiêu:", a.goal), ...labeled("b) Nội dung:", a.content), ...labeled("c) Sản phẩm:", a.product), ...labeled("d) Tổ chức thực hiện:", a.organization));
    if (a.byGroup && a.tasks.length) {
      children.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun({ text: "Phương án cá thể hóa — nhiệm vụ của từng nhóm:", bold: true })] }));
      const ordered = groups.map((g) => a.tasks.find((t) => t.groupId === g.id)).filter((t): t is NonNullable<typeof t> => !!t);
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ tableHeader: true, children: [cell("Nhóm", true, 18), cell("Nhiệm vụ", true, 40), cell("Sản phẩm", true, 21), cell("Hỗ trợ", true, 21)] }),
          ...ordered.map((t) => new TableRow({ children: [cell(gName.get(t.groupId) ?? ""), cell(t.task), cell(t.product ?? ""), cell(t.support ?? "")] })),
        ],
      }));
    }
  }

  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240 }, children: [new TextRun({ text: "IV. ĐÁNH GIÁ", bold: true })] }),
    ...(lines(l.assessment).length ? lines(l.assessment).map((x) => p(x)) : [p("(chưa nhập)", { italics: true })]),
    new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240 }, children: [new TextRun({ text: "PHỤ LỤC: DANH SÁCH NHÓM", bold: true })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: [cell("Nhóm", true, 18), cell("Đặc trưng", true, 32), cell("Thành viên", true, 50)] }),
        ...groups.map((g) => new TableRow({ children: [cell(g.name), cell([g.profile, groupCriteriaText(g)].filter(Boolean).join("\n")), cell(members(g.id))] })),
      ],
    }),
  );

  const doc = new Document({ styles: { default: { document: { run: { font: "Times New Roman", size: 26 } } } }, sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

export const phaseLabel = PHASE_LABEL;
