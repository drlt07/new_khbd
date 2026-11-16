import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { percent } from "@/lib/utils";
import type { ClassFilter, ClassInput, ClassUpdate } from "@/schemas/class";
import { assertClassOwner, getTeacherSchoolId } from "./authz";
import { resolveSubjectIds } from "./subject.service";

export async function listClasses(teacherId: string, filter: ClassFilter = {}) {
  const where: Prisma.ClassWhereInput = {
    ownerId: teacherId,
    isArchived: filter.archived === "1",
    ...(filter.q ? { name: { contains: filter.q, mode: "insensitive" } } : {}),
    ...(filter.year ? { schoolYear: filter.year } : {}),
    ...(filter.subjectId ? { subjects: { some: { subjectId: filter.subjectId } } } : {}),
  };
  const classes = await prisma.class.findMany({
    where,
    orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
    include: {
      subjects: { include: { subject: { select: { id: true, name: true } } } },
      students: { select: { profileStatus: true } },
      _count: { select: { lessonPlans: true } },
    },
  });
  return classes.map(({ students, subjects, ...c }) => {
    const confirmed = students.filter((s) => s.profileStatus === "CONFIRMED").length;
    return {
      ...c,
      subjects: subjects.map((s) => s.subject),
      studentCount: students.length,
      confirmedCount: confirmed,
      pendingCount: students.filter((s) => s.profileStatus === "PENDING_REVIEW").length,
      progress: percent(confirmed, students.length),
    };
  });
}
export type ClassListItem = Awaited<ReturnType<typeof listClasses>>[number];

export async function listSchoolYears(teacherId: string) {
  const rows = await prisma.class.findMany({
    where: { ownerId: teacherId },
    distinct: ["schoolYear"],
    select: { schoolYear: true },
    orderBy: { schoolYear: "desc" },
  });
  return rows.map((r) => r.schoolYear);
}

export async function getClassDetail(teacherId: string, classId: string) {
  await assertClassOwner(teacherId, classId);
  const cls = await prisma.class.findUniqueOrThrow({
    where: { id: classId },
    include: {
      subjects: { include: { subject: { select: { id: true, name: true } } } },
      _count: { select: { students: true, evidences: true, lessonPlans: true } },
    },
  });
  return { ...cls, subjects: cls.subjects.map((s) => s.subject) };
}

async function ensureUniqueName(teacherId: string, name: string, schoolYear: string, excludeId?: string) {
  const dup = await prisma.class.findFirst({
    where: { ownerId: teacherId, name: { equals: name, mode: "insensitive" }, schoolYear, NOT: excludeId ? { id: excludeId } : undefined },
  });
  if (dup) throw new ApiError(409, `Lớp ${name} năm học ${schoolYear} đã tồn tại`, { name: ["Tên lớp đã tồn tại trong năm học này"] });
}

export async function createClass(teacherId: string, input: ClassInput) {
  await ensureUniqueName(teacherId, input.name, input.schoolYear);
  const schoolId = await getTeacherSchoolId(teacherId);
  return prisma.$transaction(async (tx) => {
    const subjectIds = await resolveSubjectIds(tx, teacherId, input.subjects);
    return tx.class.create({
      data: {
        name: input.name,
        schoolYear: input.schoolYear,
        gradeLevel: input.gradeLevel ?? null,
        description: input.description,
        ownerId: teacherId,
        schoolId,
        subjects: { create: subjectIds.map((subjectId) => ({ subjectId, teacherId })) },
      },
    });
  });
}

export async function updateClass(teacherId: string, classId: string, input: ClassUpdate) {
  const current = await assertClassOwner(teacherId, classId);
  if (input.name || input.schoolYear) {
    await ensureUniqueName(teacherId, input.name ?? current.name, input.schoolYear ?? current.schoolYear, classId);
  }
  return prisma.$transaction(async (tx) => {
    if (input.subjects) {
      const subjectIds = await resolveSubjectIds(tx, teacherId, input.subjects);
      await tx.classSubject.deleteMany({ where: { classId, subjectId: { notIn: subjectIds } } });
      for (const subjectId of subjectIds) {
        await tx.classSubject.upsert({
          where: { classId_subjectId: { classId, subjectId } },
          update: {},
          create: { classId, subjectId, teacherId },
        });
      }
    }
    return tx.class.update({
      where: { id: classId },
      data: {
        name: input.name,
        schoolYear: input.schoolYear,
        gradeLevel: input.gradeLevel === undefined ? undefined : input.gradeLevel,
        description: input.description === undefined ? undefined : input.description,
        isArchived: input.isArchived,
      },
    });
  });
}

/** Xóa lớp chỉ khi đã lưu trữ — tránh mất dữ liệu học sinh do bấm nhầm. */
export async function deleteClass(teacherId: string, classId: string) {
  const cls = await assertClassOwner(teacherId, classId);
  if (!cls.isArchived) throw new ApiError(409, "Hãy lưu trữ lớp trước khi xóa vĩnh viễn");
  await prisma.class.delete({ where: { id: classId } });
  return cls;
}
