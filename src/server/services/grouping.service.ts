import "server-only";
import type { z } from "zod";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { suggestGroups, type GGroup, type GroupingMethod } from "@/lib/grouping/algorithm";
import type { groupingCreateSchema, groupingSaveSchema } from "@/schemas/grouping";
import { assertClassOwner, assertGroupingOwner } from "./authz";
import { splitTraits } from "./student.service";

async function loadStudents(classId: string, onlyIds?: string[], excludeIds: string[] = []) {
  const rows = await prisma.student.findMany({
    where: { classId, ...(onlyIds ? { id: { in: onlyIds } } : {}), ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}) },
    include: { traits: true },
    orderBy: { fullName: "asc" },
  });
  return rows.map((s) => ({ id: s.id, fullName: s.fullName, ...splitTraits(s.traits) }));
}

async function writeGroups(groupingId: string, groups: GGroup[]) {
  await prisma.$transaction(async (tx) => {
    await tx.group.deleteMany({ where: { groupingId } });
    for (const [i, g] of groups.entries()) {
      await tx.group.create({
        data: {
          groupingId, name: g.name, task: g.task ?? null, sortOrder: i,
          members: { create: g.members.map((m) => ({ studentId: m.studentId, reason: m.reason ?? null })) },
        },
      });
    }
    await tx.grouping.update({ where: { id: groupingId }, data: { updatedAt: new Date() } });
  });
}

export async function createGrouping(userId: string, input: z.infer<typeof groupingCreateSchema>) {
  await assertClassOwner(userId, input.classId);
  const students = await loadStudents(input.classId, undefined, input.excludeStudentIds);
  if (students.length < input.groupCount)
    throw new ApiError(422, `Lớp chỉ có ${students.length} học sinh — không thể chia thành ${input.groupCount} nhóm`, { groupCount: ["Số nhóm lớn hơn số học sinh"] });
  const grouping = await prisma.grouping.create({ data: { classId: input.classId, title: input.title, method: input.method } });
  await writeGroups(grouping.id, suggestGroups(students, input.groupCount, input.method, Date.now() % 100000));
  return grouping;
}

/** Gợi ý lại (KHÔNG lưu) — giáo viên xem rồi bấm Lưu. */
export async function resuggest(userId: string, id: string, opts: { method: GroupingMethod; groupCount: number; studentIds: string[]; seed: number }) {
  const g = await assertGroupingOwner(userId, id);
  const students = await loadStudents(g.classId, opts.studentIds);
  if (students.length !== new Set(opts.studentIds).size) throw new ApiError(422, "Có học sinh không thuộc lớp");
  if (students.length < opts.groupCount) throw new ApiError(422, "Số nhóm lớn hơn số học sinh");
  return suggestGroups(students, opts.groupCount, opts.method, opts.seed);
}

export async function listGroupings(userId: string) {
  return prisma.grouping.findMany({
    where: { class: { ownerId: userId } },
    orderBy: { updatedAt: "desc" },
    include: { class: { select: { id: true, name: true } }, groups: { select: { _count: { select: { members: true } } } } },
  });
}

export async function getGrouping(userId: string, id: string) {
  const g = await assertGroupingOwner(userId, id);
  const [grouping, classStudents] = await Promise.all([
    prisma.grouping.findUniqueOrThrow({
      where: { id },
      include: {
        class: { select: { id: true, name: true, schoolYear: true } },
        groups: { orderBy: { sortOrder: "asc" }, include: { members: { select: { studentId: true, reason: true } } } },
      },
    }),
    loadStudents(g.classId),
  ]);
  return { grouping, classStudents };
}

export async function saveGrouping(userId: string, id: string, input: z.infer<typeof groupingSaveSchema>) {
  const g = await assertGroupingOwner(userId, id);
  const ids = input.groups.flatMap((x) => x.members.map((m) => m.studentId));
  if (new Set(ids).size !== ids.length) throw new ApiError(422, "Một học sinh đang nằm ở nhiều nhóm");
  const valid = await prisma.student.count({ where: { id: { in: ids }, classId: g.classId } });
  if (valid !== ids.length) throw new ApiError(422, "Có học sinh không thuộc lớp");
  await prisma.grouping.update({ where: { id }, data: { title: input.title, ...(input.method ? { method: input.method } : {}) } });
  await writeGroups(id, input.groups.map((x) => ({ name: x.name, task: x.task ?? null, members: x.members.map((m) => ({ studentId: m.studentId, reason: m.reason ?? "" })) })));
}

export async function deleteGrouping(userId: string, id: string) {
  await assertGroupingOwner(userId, id);
  await prisma.grouping.delete({ where: { id } });
}

export async function exportGroupingXlsx(userId: string, id: string) {
  const { grouping, classStudents } = await getGrouping(userId, id);
  const byId = new Map(classStudents.map((s) => [s.id, s]));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Chia nhóm");
  ws.addRow([`${grouping.title} — Lớp ${grouping.class.name} (${grouping.class.schoolYear})`]).font = { bold: true, size: 13 };
  ws.addRow([]);
  const header = ws.addRow(["Nhóm", "Nhiệm vụ", "STT", "Họ và tên", "Lý do xếp nhóm"]);
  header.font = { bold: true };
  for (const g of grouping.groups) {
    g.members.forEach((m, i) => ws.addRow([i === 0 ? g.name : "", i === 0 ? g.task ?? "" : "", i + 1, byId.get(m.studentId)?.fullName ?? "", m.reason ?? ""]));
    ws.addRow([]);
  }
  ws.columns = [{ width: 24 }, { width: 36 }, { width: 6 }, { width: 28 }, { width: 60 }];
  return Buffer.from(await wb.xlsx.writeBuffer());
}
