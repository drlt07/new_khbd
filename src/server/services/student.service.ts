import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { ImportRow, StudentInput, StudentUpdate } from "@/schemas/student";
import { assertClassOwner, assertStudentOwner } from "./authz";

export async function listStudents(
  teacherId: string,
  filter: { q?: string; classId?: string; status?: Prisma.StudentWhereInput["profileStatus"] } = {},
) {
  return prisma.student.findMany({
    where: {
      class: { ownerId: teacherId, isArchived: false },
      ...(filter.classId ? { classId: filter.classId } : {}),
      ...(filter.status ? { profileStatus: filter.status } : {}),
      ...(filter.q
        ? { OR: [{ fullName: { contains: filter.q, mode: "insensitive" } }, { studentCode: { contains: filter.q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ class: { name: "asc" } }, { fullName: "asc" }],
    include: {
      class: { select: { id: true, name: true, schoolYear: true } },
      _count: {
        select: { interests: true, strengths: true, learningNeeds: true, evidenceLinks: true, observations: true },
      },
    },
  });
}
export type StudentListItem = Awaited<ReturnType<typeof listStudents>>[number];

async function ensureUniqueCode(classId: string, code: string | null | undefined, excludeId?: string) {
  if (!code) return;
  const dup = await prisma.student.findFirst({ where: { classId, studentCode: code, NOT: excludeId ? { id: excludeId } : undefined } });
  if (dup) throw new ApiError(409, "Mã học sinh đã tồn tại trong lớp", { studentCode: ["Mã học sinh đã tồn tại trong lớp"] });
}

export async function createStudent(teacherId: string, classId: string, input: StudentInput) {
  await assertClassOwner(teacherId, classId);
  await ensureUniqueCode(classId, input.studentCode);
  return prisma.student.create({
    data: { ...input, gender: input.gender ?? null, classId, profile: { create: {} } },
  });
}

export async function updateStudent(teacherId: string, studentId: string, input: StudentUpdate) {
  const current = await assertStudentOwner(teacherId, studentId);
  const targetClassId = input.classId ?? current.classId;
  if (input.classId && input.classId !== current.classId) await assertClassOwner(teacherId, input.classId);
  await ensureUniqueCode(targetClassId, input.studentCode === undefined ? current.studentCode : input.studentCode, studentId);
  return prisma.student.update({ where: { id: studentId }, data: { ...input, classId: targetClassId } });
}

export async function deleteStudent(teacherId: string, studentId: string) {
  const s = await assertStudentOwner(teacherId, studentId);
  await prisma.student.delete({ where: { id: studentId } });
  return s;
}

/** Ghi các dòng đã được giáo viên xem trước và xác nhận. Bỏ qua mã trùng (không ghi đè). */
export async function importStudents(teacherId: string, classId: string, rows: ImportRow[]) {
  await assertClassOwner(teacherId, classId);
  const existingCodes = new Set(
    (await prisma.student.findMany({ where: { classId, studentCode: { not: null } }, select: { studentCode: true } })).map((s) => s.studentCode!),
  );
  const seen = new Set<string>();
  const toCreate = rows.filter((r) => {
    if (!r.studentCode) return true;
    if (existingCodes.has(r.studentCode) || seen.has(r.studentCode)) return false;
    seen.add(r.studentCode);
    return true;
  });
  await prisma.$transaction(
    toCreate.map((r) =>
      prisma.student.create({
        data: {
          classId,
          fullName: r.fullName,
          studentCode: r.studentCode,
          dateOfBirth: r.dateOfBirth ? new Date(`${r.dateOfBirth}T00:00:00Z`) : null,
          gender: r.gender,
          notes: r.notes,
          profile: { create: {} },
        },
      }),
    ),
  );
  return { created: toCreate.length, skipped: rows.length - toCreate.length };
}
