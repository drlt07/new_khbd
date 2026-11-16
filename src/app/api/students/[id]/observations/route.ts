import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { observationSchema } from "@/schemas/profile";
import { addObservation } from "@/server/services/profile.service";

export const POST = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const input = observationSchema.parse(await readJson(req));
  const o = await addObservation(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "observation.create", entityType: "Student", entityId: params.id, metadata: { observationId: o.id } });
  return ok(o, { status: 201 });
});
