import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { evidenceNoteSchema } from "@/schemas/evidence";
import { createTextEvidence } from "@/server/services/evidence.service";

export const POST = teacherRoute(async ({ req, session }) => {
  const input = evidenceNoteSchema.parse(await readJson(req));
  const ev = await createTextEvidence(session.teacherId, input);
  await writeAudit({ userId: session.userId, action: "evidence.note", entityType: "StudentEvidence", entityId: ev.id });
  for (const studentId of input.studentIds) {
    await writeAudit({ userId: session.userId, action: "evidence.attach", entityType: "Student", entityId: studentId, metadata: { evidenceId: ev.id, title: ev.title } });
  }
  return ok(ev, { status: 201 });
});
