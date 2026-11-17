import { ok, readJson, userRoute } from "@/lib/api";
import { criteriaSaveSchema } from "@/schemas/session";
import { previewCriteria } from "@/server/services/session.service";

/** "Hệ thống hiểu…": diễn giải mô tả nhóm thành tiêu chí — không lưu */
export const POST = userRoute<{ id: string }>(async ({ req, session, params }) => ok(await previewCriteria(session.userId, params.id, criteriaSaveSchema.parse(await readJson(req)).groups)));
