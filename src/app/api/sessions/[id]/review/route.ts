import { ok, readJson, userRoute } from "@/lib/api";
import { reviewSaveSchema } from "@/schemas/session";
import { saveReview } from "@/server/services/session.service";

export const PUT = userRoute<{ id: string }>(async ({ req, session, params }) => { await saveReview(session.userId, params.id, reviewSaveSchema.parse(await readJson(req))); return ok({ success: true }); });
