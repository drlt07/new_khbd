import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTeacherSchoolId } from "./authz";

/** Môn học mà giáo viên có thể dùng: môn của trường hoặc môn gắn với lớp của giáo viên. */
export async function listSubjectsForTeacher(teacherId: string) {
  const schoolId = await getTeacherSchoolId(teacherId);
  return prisma.subject.findMany({
    where: {
      OR: [
        ...(schoolId ? [{ schoolId }] : []),
        { classSubjects: { some: { class: { ownerId: teacherId } } } },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** Tìm hoặc tạo môn học theo tên (không phân biệt hoa thường) trong phạm vi trường của giáo viên. */
export async function resolveSubjectIds(tx: Prisma.TransactionClient, teacherId: string, names: string[]) {
  const schoolId = await getTeacherSchoolId(teacherId);
  const unique = [...new Map(names.map((n) => [n.trim().toLowerCase(), n.trim()])).values()].filter(Boolean);
  const ids: string[] = [];
  for (const name of unique) {
    const existing = await tx.subject.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(schoolId ? { schoolId } : { schoolId: null, classSubjects: { some: { class: { ownerId: teacherId } } } }),
      },
    });
    ids.push(existing ? existing.id : (await tx.subject.create({ data: { name, schoolId } })).id);
  }
  return ids;
}
