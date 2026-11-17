import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

/** Chỉ thao tác trên dữ liệu thuộc lớp của chính mình. Trả 404 để không lộ dữ liệu người khác. */
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

export async function assertSheetInClass(classId: string, sheetId: string | null | undefined) {
  if (!sheetId) return;
  const ok = await prisma.scoreSheet.count({ where: { id: sheetId, classId } });
  if (!ok) throw new ApiError(422, "Bảng điểm không thuộc lớp này");
}
