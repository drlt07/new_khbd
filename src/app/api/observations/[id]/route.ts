import { ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { deleteObservation } from "@/server/services/profile.service";

export const DELETE = teacherRoute<{ id: string }>(async ({ session, params }) => {
  const o = await deleteObservation(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "observation.delete", entityType: "Student", entityId: o.studentId, metadata: { observationId: o.id } });
  return ok({ success: true });
});
