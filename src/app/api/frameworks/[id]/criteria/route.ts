import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { criteriaInputSchema } from "@/schemas/framework";
import { addCriteria } from "@/server/services/framework.service";

export const POST = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const input = criteriaInputSchema.parse(await readJson(req));
  const c = await addCriteria(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "criteria.create", entityType: "AssessmentFramework", entityId: params.id, metadata: { criteriaId: c.id } });
  return ok(c, { status: 201 });
});
