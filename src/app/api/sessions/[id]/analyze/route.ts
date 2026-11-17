import { ok, userRoute } from "@/lib/api";
import { runAnalysis } from "@/server/services/session.service";

export const POST = userRoute<{ id: string }>(async ({ session, params }) => ok(await runAnalysis(session.userId, params.id)));
