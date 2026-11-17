import { ok, readJson, userRoute } from "@/lib/api";
import { groupingAssignSchema } from "@/schemas/grouping";
import { previewAssignment } from "@/server/services/grouping.service";

/** Xếp lại học sinh theo đặc trưng nhóm hiện tại — không lưu */
export const POST = userRoute<{ id: string }>(async ({ req, session, params }) =>
  ok(await previewAssignment(session.userId, params.id, groupingAssignSchema.parse(await readJson(req)))));
