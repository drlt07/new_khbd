import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { ClassInput } from "@/schemas/class";
import { assertClassOwner } from "./authz";

export async function listClasses(userId: string) {
  return prisma.class.findMany({
    where: { ownerId: userId },
    orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
    include: { _count: { select: { students: true, groupings: true } } },
  });
}
export type ClassListItem = Awaited<ReturnType<typeof listClasses>>[number];

async function ensureUnique(userId: string, input: ClassInput, excludeId?: string) {
  const dup = await prisma.class.findFirst({
    where: { ownerId: userId, name: { equals: input.name, mode: "insensitive" }, schoolYear: input.schoolYear, NOT: excludeId ? { id: excludeId } : undefined },
  });
  if (dup) throw new ApiError(409, `Lớp ${input.name} năm học ${input.schoolYear} đã tồn tại`, { name: ["Tên lớp đã tồn tại trong năm học này"] });
}

export async function createClass(userId: string, input: ClassInput) {
  await ensureUnique(userId, input);
  return prisma.class.create({ data: { ...input, ownerId: userId } });
}

export async function updateClass(userId: string, id: string, input: ClassInput) {
  await assertClassOwner(userId, id);
  await ensureUnique(userId, input, id);
  return prisma.class.update({ where: { id }, data: input });
}

export async function deleteClass(userId: string, id: string) {
  await assertClassOwner(userId, id);
  await prisma.class.delete({ where: { id } });
}

/** Tiến độ 2 pha của một lớp — dùng cho tab Tổng quan và thanh tab */
export async function getClassProgress(userId: string, classId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, ownerId: userId } });
  if (!cls) return null;
  const [students, withTraits, sheets, groupings, lessons, latestGrouping, latestLesson] = await Promise.all([
    prisma.student.count({ where: { classId } }),
    prisma.student.count({ where: { classId, traits: { some: {} } } }),
    prisma.scoreSheet.count({ where: { classId } }),
    prisma.grouping.count({ where: { classId } }),
    prisma.lessonPlan.count({ where: { grouping: { classId } } }),
    prisma.grouping.findFirst({ where: { classId }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, _count: { select: { groups: true } } } }),
    prisma.lessonPlan.findFirst({ where: { grouping: { classId } }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true } }),
  ]);
  return { cls, students, withTraits, sheets, groupings, lessons, latestGrouping, latestLesson };
}
export type ClassProgress = NonNullable<Awaited<ReturnType<typeof getClassProgress>>>;
