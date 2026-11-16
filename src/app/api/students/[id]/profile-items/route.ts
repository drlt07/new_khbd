import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { profileItemSchema } from "@/schemas/profile";
import { addProfileItem } from "@/server/services/profile.service";

export const POST = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const input = profileItemSchema.parse(await readJson(req));
  const item = await addProfileItem(session.teacherId, params.id, input);
  await writeAudit({
    userId: session.userId, action: "profile.item.create", entityType: "Student", entityId: params.id,
    metadata: { dimension: input.dimension, itemId: item.id, title: input.title },
  });
  return ok(item, { status: 201 });
});
