import "server-only";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { assignToGroups, describeRange, type GroupSpec } from "@/lib/grouping/match";
import type { GroupingCreate, GroupingSave } from "@/schemas/grouping";
import { assertClassOwner, assertGroupingOwner, assertSheetInClass } from "./authz";
import { splitTraits } from "./student.service";
import { sheetAverages } from "./score.service";

/** Học sinh của lớp kèm đặc trưng và điểm trung bình (nếu có bảng điểm) */
export async function loadClassStudents(classId: string, scoreSheetId?: string | null) {
  const [rows, avg] = await Promise.all([
    prisma.student.findMany({ where: { classId }, include: { traits: true }, orderBy: { fullName: "asc" } }),
    sheetAverages(scoreSheetId),
  ]);
  return rows.map((s) => ({ id: s.id, fullName: s.fullName, ...splitTraits(s.traits), score: avg.get(s.id) ?? null }));
}
export type ClassStudent = Awaited<ReturnType<typeof loadClassStudents>>[number];

const toSpec = (g: GroupSpec): GroupSpec => ({ name: g.name, keywords: g.keywords, scoreMin: g.scoreMin ?? null, scoreMax: g.scoreMax ?? null, forSupport: g.forSupport });

function usesScores(groups: GroupSpec[]) {
  return groups.some((g) => g.scoreMin != null || g.scoreMax != null);
}

export async function createGrouping(userId: string, input: GroupingCreate) {
  await assertClassOwner(userId, input.classId);
  await assertSheetInClass(input.classId, input.scoreSheetId);
  if (usesScores(input.groups) && !input.scoreSheetId)
    throw new ApiError(422, "Có nhóm đặt khoảng điểm — hãy chọn bảng điểm dùng để xếp", { scoreSheetId: ["Chọn bảng điểm"] });
  const students = (await loadClassStudents(input.classId, input.scoreSheetId)).filter((s) => !input.excludeStudentIds.includes(s.id));
  if (students.length < input.groups.length)
    throw new ApiError(422, `Lớp chỉ có ${students.length} học sinh — ít hơn số nhóm (${input.groups.length})`);
  const assignment = assignToGroups(students, input.groups.map(toSpec), input.balanceSizes);

  return prisma.$transaction(async (tx) => {
    const grouping = await tx.grouping.create({
      data: { classId: input.classId, title: input.title, subject: input.subject ?? null, scoreSheetId: input.scoreSheetId ?? null, balanceSizes: input.balanceSizes },
    });
    for (const [gi, g] of input.groups.entries()) {
      await tx.group.create({
        data: {
          groupingId: grouping.id, name: g.name, profile: g.profile ?? null, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, sortOrder: gi,
          members: { create: assignment.filter((a) => a.groupIndex === gi).map((a) => ({ studentId: a.studentId, reason: a.reason })) },
        },
      });
    }
    return grouping;
  });
}

/** Xếp lại theo đặc trưng hiện tại — KHÔNG lưu, GV xem rồi bấm Lưu */
export async function previewAssignment(userId: string, id: string, input: { scoreSheetId?: string | null; balanceSizes: boolean; groups: GroupSpec[]; studentIds: string[] }) {
  const g = await assertGroupingOwner(userId, id);
  await assertSheetInClass(g.classId, input.scoreSheetId);
  const all = await loadClassStudents(g.classId, input.scoreSheetId);
  const wanted = new Set(input.studentIds);
  const students = all.filter((s) => wanted.has(s.id));
  if (students.length !== wanted.size) throw new ApiError(422, "Có học sinh không thuộc lớp");
  return { assignment: assignToGroups(students, input.groups.map(toSpec), input.balanceSizes), scores: Object.fromEntries(all.map((s) => [s.id, s.score])) };
}

export async function listGroupings(userId: string, classId?: string) {
  return prisma.grouping.findMany({
    where: { class: { ownerId: userId }, ...(classId ? { classId } : {}) },
    orderBy: { updatedAt: "desc" },
    include: {
      class: { select: { id: true, name: true } },
      scoreSheet: { select: { subject: true, fileName: true } },
      groups: { orderBy: { sortOrder: "asc" }, select: { name: true, _count: { select: { members: true } } } },
      _count: { select: { lessonPlans: true } },
    },
  });
}

export async function getGrouping(userId: string, id: string) {
  await assertGroupingOwner(userId, id);
  const grouping = await prisma.grouping.findUniqueOrThrow({
    where: { id },
    include: {
      class: { select: { id: true, name: true, schoolYear: true } },
      scoreSheet: { select: { id: true, subject: true, fileName: true } },
      groups: { orderBy: { sortOrder: "asc" }, include: { members: { select: { studentId: true, reason: true } }, _count: { select: { tasks: true } } } },
      _count: { select: { lessonPlans: true } },
    },
  });
  return { grouping, classStudents: await loadClassStudents(grouping.classId, grouping.scoreSheetId) };
}

export async function saveGrouping(userId: string, id: string, input: GroupingSave) {
  const g = await assertGroupingOwner(userId, id);
  await assertSheetInClass(g.classId, input.scoreSheetId);
  const ids = input.groups.flatMap((x) => x.members.map((m) => m.studentId));
  if (new Set(ids).size !== ids.length) throw new ApiError(422, "Một học sinh đang nằm ở nhiều nhóm");
  if (ids.length && (await prisma.student.count({ where: { id: { in: ids }, classId: g.classId } })) !== ids.length)
    throw new ApiError(422, "Có học sinh không thuộc lớp");
  const existing = new Set((await prisma.group.findMany({ where: { groupingId: id }, select: { id: true } })).map((x) => x.id));

  await prisma.$transaction(async (tx) => {
    await tx.grouping.update({ where: { id }, data: { title: input.title, subject: input.subject ?? null, scoreSheetId: input.scoreSheetId ?? null, balanceSizes: input.balanceSizes } });
    const keep = input.groups.map((x) => x.id).filter((x): x is string => !!x && existing.has(x));
    // Nhóm bị xóa: nhiệm vụ của nhóm đó trong các KHBD cũng bị xóa (cascade)
    await tx.group.deleteMany({ where: { groupingId: id, id: { notIn: keep } } });
    for (const [gi, x] of input.groups.entries()) {
      const data = { name: x.name, profile: x.profile ?? null, keywords: x.keywords, scoreMin: x.scoreMin, scoreMax: x.scoreMax, forSupport: x.forSupport, sortOrder: gi };
      const groupId = x.id && existing.has(x.id)
        ? (await tx.group.update({ where: { id: x.id }, data })).id
        : (await tx.group.create({ data: { ...data, groupingId: id } })).id;
      await tx.groupMember.deleteMany({ where: { groupId } });
      await tx.groupMember.createMany({ data: x.members.map((m) => ({ groupId, studentId: m.studentId, reason: m.reason ?? null })) });
    }
  });
}

export async function deleteGrouping(userId: string, id: string) {
  await assertGroupingOwner(userId, id);
  await prisma.grouping.delete({ where: { id } });
}

export function groupCriteriaText(g: { keywords: string[]; scoreMin: number | null; scoreMax: number | null; forSupport: boolean }) {
  const parts: string[] = [];
  if (g.keywords.length) parts.push(`Thế mạnh/sở thích: ${g.keywords.join(", ")}`);
  const r = describeRange(g);
  if (r) parts.push(`Điểm ${r}`);
  if (g.forSupport) parts.push("Ưu tiên HS cần hỗ trợ");
  return parts.join(" · ");
}

export async function exportGroupingXlsx(userId: string, id: string) {
  const { grouping, classStudents } = await getGrouping(userId, id);
  const byId = new Map(classStudents.map((s) => [s.id, s]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Bộ nhóm");
  ws.addRow([`${grouping.title} — Lớp ${grouping.class.name} (${grouping.class.schoolYear})`]).font = { bold: true, size: 13 };
  ws.addRow([]);
  ws.addRow(["Nhóm", "Đặc trưng nhóm", "Tiêu chí xếp", "STT", "Họ và tên", "Điểm TB", "Lý do xếp nhóm"]).font = { bold: true };
  for (const g of grouping.groups) {
    g.members.forEach((m, i) => {
      const s = byId.get(m.studentId);
      ws.addRow([i === 0 ? g.name : "", i === 0 ? g.profile ?? "" : "", i === 0 ? groupCriteriaText(g) : "", i + 1, s?.fullName ?? "", s?.score != null ? Math.round(s.score * 10) / 10 : "", m.reason ?? ""]);
    });
    ws.addRow([]);
  }
  ws.columns = [{ width: 22 }, { width: 40 }, { width: 36 }, { width: 6 }, { width: 26 }, { width: 9 }, { width: 60 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}
