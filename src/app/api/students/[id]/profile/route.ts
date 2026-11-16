import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { profileMetaSchema } from "@/schemas/profile";
import { updateProfileMeta } from "@/server/services/profile.service";

export const PATCH = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const input = profileMetaSchema.parse(await readJson(req));
  await updateProfileMeta(session.teacherId, params.id, input);
  await writeAudit({
    userId: session.userId, action: "profile.update", entityType: "Student", entityId: params.id,
    metadata: { fields: Object.keys(input), ...(input.profileStatus ? { profileStatus: input.profileStatus } : {}) },
  });
  return ok({ success: true });
});
