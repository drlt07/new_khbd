import { ok, userRoute } from "@/lib/api";
import { deleteScoreSheet } from "@/server/services/score.service";

export const DELETE = userRoute<{ id: string }>(async ({ session, params }) => {
  await deleteScoreSheet(session.userId, params.id);
  return ok({ success: true });
});
