import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { listSubjectsForTeacher } from "@/server/services/subject.service";

export async function assertSubjectAccessible(teacherId: string, subjectId: string) {
  const subjects = await listSubjectsForTeacher(teacherId);
  if (!subjects.some((s) => s.id === subjectId)) {
    // Môn tồn tại nhưng không thuộc phạm vi giáo viên
    const exists = await prisma.subject.count({ where: { id: subjectId } });
    throw new ApiError(exists ? 403 : 404, "Môn học không hợp lệ", { subjectId: ["Môn học không hợp lệ"] });
  }
}
