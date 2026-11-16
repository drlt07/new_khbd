import { ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { deleteAcademicResult } from "@/server/services/profile.service";

export const DELETE = teacherRoute<{ id: string }>(async ({ session, params }) => {
  const r = await deleteAcademicResult(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "academic-result.delete", entityType: "Student", entityId: r.studentId, metadata: { resultId: r.id } });
  return ok({ success: true });
});
