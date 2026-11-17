import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

/** Chỉ thao tác trên lớp của chính mình. Trả 404 để không lộ dữ liệu người khác. */
export async function assertClassOwner(userId: string, classId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, ownerId: userId } });
  if (!cls) throw new ApiError(404, "Không tìm thấy lớp học");
  return cls;
}

export async function assertStudentOwner(userId: string, studentId: string) {
  const s = await prisma.student.findFirst({ where: { id: studentId, class: { ownerId: userId } } });
  if (!s) throw new ApiError(404, "Không tìm thấy học sinh");
  return s;
}

export async function assertGroupingOwner(userId: string, groupingId: string) {
  const g = await prisma.grouping.findFirst({ where: { id: groupingId, class: { ownerId: userId } } });
  if (!g) throw new ApiError(404, "Không tìm thấy kết quả chia nhóm");
  return g;
}
