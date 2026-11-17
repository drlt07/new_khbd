import { ok, userRoute } from "@/lib/api";
import { generate } from "@/server/services/lesson.service";

export const POST = userRoute<{ id: string }>(async ({ session, params }) => ok(await generate(session.userId, params.id)));
