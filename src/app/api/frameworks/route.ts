import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { frameworkCreateSchema } from "@/schemas/framework";
import { createFramework, listFrameworks } from "@/server/services/framework.service";

export const GET = teacherRoute(async ({ session }) => ok(await listFrameworks(session.teacherId)));

export const POST = teacherRoute(async ({ req, session }) => {
  const input = frameworkCreateSchema.parse(await readJson(req));
  const fw = await createFramework(session.teacherId, input);
  await writeAudit({ userId: session.userId, action: "framework.create", entityType: "AssessmentFramework", entityId: fw.id });
  return ok(fw, { status: 201 });
});
