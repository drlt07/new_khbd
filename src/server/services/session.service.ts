import "server-only";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { describeRange, type MStudent } from "@/lib/grouping/match";
import { effectiveCriteria, type EffectiveCriteria } from "@/lib/grouping/interpret";
import { checkGrouping } from "@/lib/grouping/check";
import { summarizeGroup } from "@/lib/grouping/profile";
import { analyzeAssignment } from "@/server/ai/grouping.ai";
import type { CriteriaSave, ReviewSave } from "@/schemas/session";
import { assertClassOwner, assertSheetInClass } from "./authz";
import { splitTraits } from "./student.service";
import { sheetAverages } from "./score.service";
import { log } from "./log.service";

// ─────────────── Truy vấn ───────────────

export async function assertSessionOwner(userId: string, id: string) {
  const s = await prisma.groupingSession.findFirst({ where: { id, class: { ownerId: userId } } });
  if (!s) throw new ApiError(404, "Không tìm thấy phiên phân nhóm");
  return s;
}

export async function loadStudents(classId: string, scoreSheetId: string | null): Promise<MStudent[]> {
  const [rows, avg] = await Promise.all([
    prisma.student.findMany({ where: { classId }, include: { traits: true }, orderBy: { fullName: "asc" } }),
    sheetAverages(scoreSheetId),
  ]);
  return rows.map((s) => ({ id: s.id, fullName: s.fullName, ...splitTraits(s.traits), score: avg.get(s.id) ?? null }));
}

async function vocabulary(classId: string) {
  return (await prisma.studentTrait.findMany({ where: { student: { classId } }, distinct: ["label"], select: { label: true } })).map((t) => t.label);
}

const sessionInclude = {
  class: { select: { id: true, name: true, schoolYear: true } },
  scoreSheet: { select: { id: true, subject: true, fileName: true } },
  groups: { orderBy: { sortOrder: "asc" }, include: { members: { select: { studentId: true, reason: true, fit: true } } } },
  lessonPlans: { select: { id: true, title: true, status: true } },
} satisfies Prisma.GroupingSessionInclude;

export async function getSession(userId: string, id: string) {
  await assertSessionOwner(userId, id);
  const session = await prisma.groupingSession.findUniqueOrThrow({ where: { id }, include: sessionInclude });
  const [students, versions, sheets, vocab] = await Promise.all([
    loadStudents(session.classId, session.scoreSheetId),
    prisma.groupingSession.findMany({ where: { lineageId: session.lineageId }, orderBy: { version: "desc" }, select: { id: true, version: true, status: true, updatedAt: true, _count: { select: { lessonPlans: true } } } }),
    prisma.scoreSheet.findMany({ where: { classId: session.classId }, orderBy: { createdAt: "desc" }, select: { id: true, subject: true, fileName: true, createdAt: true } }),
    vocabulary(session.classId),
  ]);
  return { session, students, versions, sheets, vocab };
}
export type SessionDetail = Awaited<ReturnType<typeof getSession>>;

export async function listSessions(userId: string, classId?: string) {
  return prisma.groupingSession.findMany({
    where: { class: { ownerId: userId }, ...(classId ? { classId } : {}) },
    orderBy: [{ updatedAt: "desc" }],
    include: { class: { select: { id: true, name: true } }, groups: { orderBy: { sortOrder: "asc" }, select: { name: true, _count: { select: { members: true } } } }, _count: { select: { lessonPlans: true } } },
  });
}

/** Phiên đã duyệt mới nhất của mỗi bộ nhóm — nguồn dữ liệu cho Pha 2 */
export async function confirmedSessions(userId: string, classId?: string) {
  return prisma.groupingSession.findMany({
    where: { class: { ownerId: userId }, status: "CONFIRMED", ...(classId ? { classId } : {}) },
    orderBy: { confirmedAt: "desc" },
    include: { class: { select: { id: true, name: true } }, groups: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, competency: true, _count: { select: { members: true } } } } },
  });
}

function assertDraft(s: { status: string }) {
  if (s.status !== "DRAFT") throw new ApiError(409, "Phiên này đã được duyệt. Tạo phiên bản mới để chỉnh sửa.");
}

// ─────────────── Bước 0–1: tạo phiên, chọn dữ liệu ───────────────

export async function createSession(userId: string, input: { classId: string; title: string; subject?: string | null }) {
  const cls = await assertClassOwner(userId, input.classId);
  const sheet = await prisma.scoreSheet.findFirst({ where: { classId: input.classId, ...(input.subject ? { subject: input.subject } : {}) }, orderBy: { createdAt: "desc" } });
  const s = await prisma.groupingSession.create({
    data: { classId: input.classId, lineageId: randomUUID(), title: input.title, subject: input.subject ?? null, scoreSheetId: sheet?.id ?? null, step: 1 },
  });
  await log(userId, cls.id, "session.create", `Bắt đầu phân nhóm “${s.title}” cho lớp ${cls.name}`, `/phase1/${s.id}`);
  return s;
}

export async function updateSessionData(userId: string, id: string, input: { title?: string; subject?: string | null; scoreSheetId?: string | null }) {
  const s = await assertSessionOwner(userId, id);
  if (input.scoreSheetId !== undefined) { assertDraft(s); await assertSheetInClass(s.classId, input.scoreSheetId); }
  const students = await prisma.student.count({ where: { classId: s.classId } });
  return prisma.groupingSession.update({
    where: { id },
    data: { ...input, step: students >= 2 ? Math.max(s.step, 2) : s.step },
  });
}

// ─────────────── Bước 2: tiêu chí ───────────────

export async function previewCriteria(userId: string, id: string, groups: CriteriaSave["groups"]) {
  const s = await assertSessionOwner(userId, id);
  const [students, vocab] = await Promise.all([loadStudents(s.classId, s.scoreSheetId), vocabulary(s.classId)]);
  return effectiveCriteria(groups.map((g) => ({ ...g, description: g.description ?? null })), vocab, students.map((x) => x.score).filter((x): x is number => x != null));
}

export async function saveCriteria(userId: string, id: string, input: CriteriaSave) {
  const s = await assertSessionOwner(userId, id);
  assertDraft(s);
  const existing = await prisma.groupProfile.findMany({ where: { sessionId: id }, select: { id: true } });
  const keep = new Set(input.groups.map((g) => g.id).filter(Boolean));
  const eff = await previewCriteria(userId, id, input.groups);
  await prisma.$transaction(async (tx) => {
    await tx.groupProfile.deleteMany({ where: { sessionId: id, id: { notIn: existing.map((e) => e.id).filter((x) => keep.has(x)) } } });
    for (const [i, g] of input.groups.entries()) {
      const data = {
        name: g.name, description: g.description ?? null, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport,
        maxSize: g.maxSize, sortOrder: i, criteria: eff[i] as unknown as Prisma.InputJsonValue,
      };
      if (g.id && existing.some((e) => e.id === g.id)) await tx.groupProfile.update({ where: { id: g.id }, data });
      else await tx.groupProfile.create({ data: { ...data, sessionId: id, slotKey: randomUUID() } });
    }
    await tx.groupingSession.update({ where: { id }, data: { balanceSizes: input.balanceSizes, step: Math.max(s.step, 3) } });
  });
  return eff;
}

// ─────────────── Bước 3: AI phân tích & phân nhóm ───────────────

export async function runAnalysis(userId: string, id: string) {
  const s = await assertSessionOwner(userId, id);
  assertDraft(s);
  const groups = await prisma.groupProfile.findMany({ where: { sessionId: id }, orderBy: { sortOrder: "asc" } });
  if (groups.length < 2) throw new ApiError(422, "Cần thiết lập ít nhất 2 nhóm ở bước Tiêu chí");
  const [students, vocab] = await Promise.all([loadStudents(s.classId, s.scoreSheetId), vocabulary(s.classId)]);
  if (students.length < groups.length) throw new ApiError(422, `Lớp có ${students.length} học sinh — ít hơn số nhóm (${groups.length})`);
  const eff = effectiveCriteria(groups.map((g) => ({ ...g })), vocab, students.map((x) => x.score).filter((x): x is number => x != null));
  const { assignment, engine, notes } = await analyzeAssignment({ students, groups: eff.map((e, i) => ({ ...e, description: groups[i].description })), balanceSizes: s.balanceSizes });

  await prisma.$transaction(async (tx) => {
    for (const [gi, g] of groups.entries()) {
      await tx.groupMember.deleteMany({ where: { groupId: g.id } });
      await tx.groupMember.createMany({ data: assignment.filter((a) => a.groupIndex === gi).map((a) => ({ groupId: g.id, studentId: a.studentId, reason: a.reason, fit: a.fit })) });
      await tx.groupProfile.update({ where: { id: g.id }, data: { criteria: eff[gi] as unknown as Prisma.InputJsonValue } });
    }
    await tx.groupingSession.update({ where: { id }, data: { engine, analyzedAt: new Date(), step: Math.max(s.step, 3) } });
  });
  await refreshProfiles(id, students, eff);
  await log(userId, s.classId, "session.analyze", `Phân nhóm “${s.title}” (v${s.version}) bằng ${engine.startsWith("claude") ? "Claude AI" : "bộ máy quy tắc"}`, `/phase1/${id}?step=3`);
  return { engine, notes };
}

/** Tính lại hồ sơ nhóm (đặc trưng năng lực, điểm mạnh, khó khăn, nhu cầu) từ thành viên hiện tại */
export async function refreshProfiles(id: string, students?: MStudent[], eff?: EffectiveCriteria[]) {
  const s = await prisma.groupingSession.findUniqueOrThrow({ where: { id }, include: { groups: { orderBy: { sortOrder: "asc" }, include: { members: true } } } });
  const list = students ?? (await loadStudents(s.classId, s.scoreSheetId));
  const byId = new Map(list.map((x) => [x.id, x]));
  for (const [gi, g] of s.groups.entries()) {
    const level = (eff?.[gi]?.level ?? (g.criteria as { level?: number } | null)?.level ?? null) as 0 | 1 | 2 | 3 | null;
    const sum = summarizeGroup({ name: g.name, description: g.description, level, forSupport: g.forSupport }, g.members.map((m) => byId.get(m.studentId)).filter((x): x is MStudent => !!x));
    await prisma.groupProfile.update({ where: { id: g.id }, data: sum });
  }
}

// ─────────────── Bước 4: duyệt nhóm ───────────────

export async function saveReview(userId: string, id: string, input: ReviewSave) {
  const s = await assertSessionOwner(userId, id);
  assertDraft(s);
  const ids = input.groups.flatMap((g) => g.members.map((m) => m.studentId));
  if (new Set(ids).size !== ids.length) throw new ApiError(422, "Một học sinh đang nằm ở nhiều nhóm");
  if (ids.length && (await prisma.student.count({ where: { id: { in: ids }, classId: s.classId } })) !== ids.length) throw new ApiError(422, "Có học sinh không thuộc lớp");
  const own = new Set((await prisma.groupProfile.findMany({ where: { sessionId: id }, select: { id: true } })).map((g) => g.id));
  if (!input.groups.every((g) => own.has(g.id))) throw new ApiError(422, "Nhóm không thuộc phiên này");
  await prisma.$transaction(async (tx) => {
    for (const g of input.groups) {
      await tx.groupProfile.update({ where: { id: g.id }, data: { name: g.name, competency: g.competency ?? null, strengths: g.strengths, difficulties: g.difficulties, needs: g.needs ?? null, supportGoal: g.supportGoal ?? null } });
      await tx.groupMember.deleteMany({ where: { groupId: g.id } });
      await tx.groupMember.createMany({ data: g.members.map((m) => ({ groupId: g.id, studentId: m.studentId, reason: m.reason ?? null, fit: m.fit ?? null })) });
    }
    await tx.groupingSession.update({ where: { id }, data: { step: 4 } });
  });
}

/** Xác nhận: phiên trở thành nguồn dữ liệu cho Pha 2; phiên đã duyệt trước đó (cùng bộ nhóm) chuyển sang SUPERSEDED */
export async function confirmSession(userId: string, id: string) {
  const s = await assertSessionOwner(userId, id);
  assertDraft(s);
  const detail = await prisma.groupingSession.findUniqueOrThrow({ where: { id }, include: { groups: { include: { members: true } } } });
  const students = await loadStudents(s.classId, s.scoreSheetId);
  const check = checkGrouping(detail.groups.map((g) => ({ name: g.name, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, maxSize: g.maxSize, members: g.members.map((m) => m.studentId) })), students, students.map((x) => x.id));
  const errors = check.issues.filter((i) => i.level === "error");
  if (errors.length) throw new ApiError(422, `Chưa thể xác nhận: ${errors.map((e) => e.message).join("; ")}`);
  const outdated = await prisma.$transaction(async (tx) => {
    const prev = await tx.groupingSession.findMany({ where: { lineageId: s.lineageId, status: "CONFIRMED", NOT: { id } }, select: { id: true } });
    await tx.groupingSession.updateMany({ where: { id: { in: prev.map((p) => p.id) } }, data: { status: "SUPERSEDED" } });
    await tx.groupingSession.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: new Date(), step: 4 } });
    return tx.lessonPlan.count({ where: { sessionId: { in: prev.map((p) => p.id) } } });
  });
  await log(userId, s.classId, "session.confirm", `Duyệt hồ sơ nhóm “${s.title}” phiên bản ${s.version}${outdated ? ` — ${outdated} KHBD cần cập nhật` : ""}`, `/phase1/${id}?step=4`);
  return { outdatedLessons: outdated };
}

/** Sửa một phiên đã duyệt = tạo phiên bản mới (bản nháp) sao chép từ phiên đó */
export async function newVersion(userId: string, id: string) {
  const s = await assertSessionOwner(userId, id);
  const draft = await prisma.groupingSession.findFirst({ where: { lineageId: s.lineageId, status: "DRAFT" } });
  if (draft) return draft;
  const src = await prisma.groupingSession.findUniqueOrThrow({ where: { id }, include: { groups: { include: { members: true } } } });
  const max = await prisma.groupingSession.aggregate({ where: { lineageId: s.lineageId }, _max: { version: true } });
  const created = await prisma.$transaction(async (tx) => {
    const v = await tx.groupingSession.create({
      data: { classId: src.classId, lineageId: src.lineageId, version: (max._max.version ?? 1) + 1, title: src.title, subject: src.subject, scoreSheetId: src.scoreSheetId, balanceSizes: src.balanceSizes, engine: src.engine, analyzedAt: src.analyzedAt, step: 4, isSample: src.isSample },
    });
    for (const g of src.groups) {
      const { id: _gid, sessionId: _sid, members, criteria, ...rest } = g;
      void _gid; void _sid;
      await tx.groupProfile.create({ data: { ...rest, criteria: criteria ?? undefined, sessionId: v.id, members: { create: members.map((m) => ({ studentId: m.studentId, reason: m.reason, fit: m.fit })) } } });
    }
    return v;
  });
  await log(userId, s.classId, "session.version", `Tạo phiên bản ${created.version} của “${s.title}” để chỉnh sửa`, `/phase1/${created.id}?step=4`);
  return created;
}

export async function deleteSession(userId: string, id: string) {
  const s = await assertSessionOwner(userId, id);
  await prisma.groupingSession.delete({ where: { id } });
  await log(userId, s.classId, "session.delete", `Xóa phiên phân nhóm “${s.title}” v${s.version}`);
}

export function criteriaText(g: { keywords: string[]; scoreMin: number | null; scoreMax: number | null; forSupport: boolean; maxSize?: number | null }) {
  const parts: string[] = [];
  if (g.keywords.length) parts.push(`Đặc trưng: ${g.keywords.join(", ")}`);
  const r = describeRange(g);
  if (r) parts.push(`Điểm ${r}`);
  if (g.forSupport) parts.push("Ưu tiên HS cần hỗ trợ");
  if (g.maxSize) parts.push(`Tối đa ${g.maxSize} HS`);
  return parts.join(" · ");
}

export async function exportSessionXlsx(userId: string, id: string) {
  const { session, students } = await getSession(userId, id);
  const byId = new Map(students.map((s) => [s.id, s]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Hồ sơ nhóm");
  ws.addRow([`${session.title} — v${session.version} — Lớp ${session.class.name} (${session.class.schoolYear})`]).font = { bold: true, size: 13 };
  ws.addRow([]);
  ws.addRow(["Nhóm", "Đặc trưng năng lực", "Điểm mạnh", "Khó khăn", "Nhu cầu học tập", "Mục tiêu hỗ trợ", "STT", "Họ và tên", "Điểm TB", "Lý do xếp nhóm"]).font = { bold: true };
  for (const g of session.groups) {
    g.members.forEach((m, i) => {
      const s = byId.get(m.studentId);
      ws.addRow([i === 0 ? g.name : "", i === 0 ? g.competency ?? "" : "", i === 0 ? g.strengths.join(", ") : "", i === 0 ? g.difficulties.join(", ") : "", i === 0 ? g.needs ?? "" : "", i === 0 ? g.supportGoal ?? "" : "", i + 1, s?.fullName ?? "", s?.score != null ? Math.round(s.score * 10) / 10 : "", m.reason ?? ""]);
    });
    ws.addRow([]);
  }
  ws.columns = [{ width: 20 }, { width: 36 }, { width: 28 }, { width: 28 }, { width: 36 }, { width: 36 }, { width: 6 }, { width: 24 }, { width: 8 }, { width: 50 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}
