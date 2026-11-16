import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { academicResultSchema } from "@/schemas/profile";
import { addAcademicResult } from "@/server/services/profile.service";

export const POST = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const input = academicResultSchema.parse(await readJson(req));
  const r = await addAcademicResult(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "academic-result.create", entityType: "Student", entityId: params.id, metadata: { resultId: r.id } });
  return ok(r, { status: 201 });
});
