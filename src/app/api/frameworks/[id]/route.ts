import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { frameworkUpdateSchema } from "@/schemas/framework";
import { deleteFramework, getFramework, updateFramework } from "@/server/services/framework.service";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ session, params }) => ok(await getFramework(session.teacherId, params.id)));

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = frameworkUpdateSchema.parse(await readJson(req));
  const fw = await updateFramework(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "framework.update", entityType: "AssessmentFramework", entityId: fw.id });
  return ok(fw);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  await deleteFramework(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "framework.delete", entityType: "AssessmentFramework", entityId: params.id });
  return ok({ success: true });
});
