import { ok, userRoute } from "@/lib/api";
import { newVersion } from "@/server/services/session.service";

export const POST = userRoute<{ id: string }>(async ({ session, params }) => ok(await newVersion(session.userId, params.id)));
