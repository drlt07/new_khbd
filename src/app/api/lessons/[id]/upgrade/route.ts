import { ok, userRoute } from "@/lib/api";
import { upgradeToLatest } from "@/server/services/lesson.service";

export const POST = userRoute<{ id: string }>(async ({ session, params }) => ok(await upgradeToLatest(session.userId, params.id)));
