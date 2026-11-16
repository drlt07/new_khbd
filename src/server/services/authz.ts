import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

/**
 * Phân quyền theo dữ liệu: giáo viên chỉ thao tác trên lớp mình sở hữu.
 * Trả 404 (không phải 403) để không tiết lộ sự tồn tại của dữ liệu người khác.
 */
export async function assertClassOwner(teacherId: string, classId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, ownerId: teacherId } });
  if (!cls) throw new ApiError(404, "Không tìm thấy lớp học");
  return cls;
}

export async function assertStudentOwner(teacherId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, class: { ownerId: teacherId } },
    include: { class: { select: { id: true, name: true, schoolId: true } } },
  });
  if (!student) throw new ApiError(404, "Không tìm thấy học sinh");
  return student;
}

export async function assertFrameworkOwner(teacherId: string, frameworkId: string) {
  const fw = await prisma.assessmentFramework.findFirst({ where: { id: frameworkId, ownerId: teacherId } });
  if (!fw) throw new ApiError(404, "Không tìm thấy khung thông tin");
  return fw;
}

export async function getTeacherSchoolId(teacherId: string) {
  const t = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { schoolId: true } });
  return t?.schoolId ?? null;
}
