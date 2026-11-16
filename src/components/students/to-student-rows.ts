import type { StudentListItem } from "@/server/services/student.service";
import type { StudentRow } from "./student-table";

export function toStudentRows(list: StudentListItem[]): StudentRow[] {
  return list.map((s) => ({
    id: s.id,
    classId: s.classId,
    className: s.class.name,
    fullName: s.fullName,
    studentCode: s.studentCode,
    dateOfBirth: s.dateOfBirth,
    gender: s.gender,
    notes: s.notes,
    profileStatus: s.profileStatus,
    isSample: s.isSample,
    counts: {
      interests: s._count.interests,
      strengths: s._count.strengths,
      learningNeeds: s._count.learningNeeds,
      evidence: s._count.evidenceLinks,
      observations: s._count.observations,
    },
  }));
}
