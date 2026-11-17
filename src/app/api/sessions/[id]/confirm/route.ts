import { ok, userRoute } from "@/lib/api";
import { confirmSession } from "@/server/services/session.service";

export const POST = userRoute<{ id: string }>(async ({ session, params }) => ok(await confirmSession(session.userId, params.id)));
