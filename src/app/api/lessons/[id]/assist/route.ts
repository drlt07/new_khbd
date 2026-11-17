import { ok, readJson, userRoute } from "@/lib/api";
import { assistSchema } from "@/schemas/lesson";
import { assist } from "@/server/services/lesson.service";

/** Trợ lý AI trong trình soạn KHBD — trả về đề xuất, KHÔNG tự lưu; GV chọn áp dụng */
export const POST = userRoute<{ id: string }>(async ({ req, session, params }) => ok(await assist(session.userId, params.id, assistSchema.parse(await readJson(req)))));
