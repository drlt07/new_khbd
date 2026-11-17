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

/** Không gian làm việc của một lớp: dữ liệu học sinh, các bộ nhóm (theo phiên bản), KHBD, lịch sử */
export async function getClassWorkspace(userId: string, classId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, ownerId: userId } });
  if (!cls) return null;
  const [students, withTraits, sheets, sessions, lessons, logs] = await Promise.all([
    prisma.student.count({ where: { classId } }),
    prisma.student.count({ where: { classId, traits: { some: {} } } }),
    prisma.scoreSheet.findMany({ where: { classId }, orderBy: { createdAt: "desc" }, select: { id: true, subject: true, fileName: true, createdAt: true } }),
    prisma.groupingSession.findMany({
      where: { classId }, orderBy: [{ updatedAt: "desc" }],
      select: { id: true, lineageId: true, title: true, version: true, status: true, step: true, updatedAt: true, groups: { select: { name: true, _count: { select: { members: true } } }, orderBy: { sortOrder: "asc" } }, _count: { select: { lessonPlans: true } } },
    }),
    prisma.lessonPlan.findMany({ where: { session: { classId } }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, subject: true, status: true, updatedAt: true, session: { select: { title: true, version: true, status: true } } } }),
    prisma.activityLog.findMany({ where: { classId, userId }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  // Gom phiên theo bộ nhóm (lineage): hiển thị phiên đáng chú ý nhất + các phiên bản
  const lineages = new Map<string, typeof sessions>();
  for (const s of sessions) lineages.set(s.lineageId, [...(lineages.get(s.lineageId) ?? []), s]);
  const groupSets = [...lineages.values()].map((vs) => {
    const sorted = [...vs].sort((a, b) => b.version - a.version);
    return { current: sorted.find((v) => v.status === "CONFIRMED") ?? sorted[0], draft: sorted.find((v) => v.status === "DRAFT") ?? null, versions: sorted };
  });
  return { cls, students, withTraits, sheets, groupSets, lessons, logs };
}
export type ClassWorkspace = NonNullable<Awaited<ReturnType<typeof getClassWorkspace>>>;
