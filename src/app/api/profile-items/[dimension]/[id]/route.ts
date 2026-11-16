import { z } from "zod";
import { ProfileDimension } from "@prisma/client";
import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { profileItemUpdateSchema } from "@/schemas/profile";
import { deleteProfileItem, updateProfileItem } from "@/server/services/profile.service";

type P = { dimension: string; id: string };
const dim = z.nativeEnum(ProfileDimension, { message: "Phương diện hồ sơ không hợp lệ" });

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const dimension = dim.parse(params.dimension);
  const input = profileItemUpdateSchema.parse(await readJson(req));
  const item = await updateProfileItem(session.teacherId, dimension, params.id, input);
  await writeAudit({
    userId: session.userId, action: "profile.item.update", entityType: "Student", entityId: item.studentId,
    metadata: { dimension, itemId: params.id, title: input.title },
  });
  return ok(item);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const dimension = dim.parse(params.dimension);
  const item = await deleteProfileItem(session.teacherId, dimension, params.id);
  await writeAudit({
    userId: session.userId, action: "profile.item.delete", entityType: "Student", entityId: item.studentId,
    metadata: { dimension, itemId: params.id },
  });
  return ok({ success: true });
});
