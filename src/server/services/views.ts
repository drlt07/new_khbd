import "server-only";
import { prisma } from "@/lib/prisma";
import type { StudentRow } from "@/components/students/student-table";
import { splitTraits, type StudentWithTraits } from "./student.service";

export function toStudentRows(list: StudentWithTraits[]): StudentRow[] {
  return list.map((s) => ({
    id: s.id, classId: s.classId, className: s.class.name, fullName: s.fullName, studentCode: s.studentCode,
    gender: s.gender, notes: s.notes, isSample: s.isSample, ...splitTraits(s.traits),
  }));
}

/** Gợi ý khi nhập đặc điểm: các nhãn đã dùng trong các lớp của giáo viên */
export async function traitSuggestions(userId: string) {
  const rows = await prisma.studentTrait.findMany({
    where: { student: { class: { ownerId: userId } } },
    distinct: ["kind", "label"],
    select: { kind: true, label: true },
    orderBy: { label: "asc" },
  });
  return splitTraits(rows);
}
