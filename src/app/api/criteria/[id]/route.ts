import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { criteriaUpdateSchema } from "@/schemas/framework";
import { deleteCriteria, updateCriteria } from "@/server/services/framework.service";

type P = { id: string };

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = criteriaUpdateSchema.parse(await readJson(req));
  const c = await updateCriteria(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "criteria.update", entityType: "AssessmentFramework", entityId: c.frameworkId, metadata: { criteriaId: c.id } });
  return ok(c);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const c = await deleteCriteria(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "criteria.delete", entityType: "AssessmentFramework", entityId: c.frameworkId, metadata: { criteriaId: c.id } });
  return ok({ success: true });
});
