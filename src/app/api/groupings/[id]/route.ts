import { ok, readJson, userRoute } from "@/lib/api";
import { groupingSaveSchema } from "@/schemas/grouping";
import { deleteGrouping, getGrouping, saveGrouping } from "@/server/services/grouping.service";

type P = { id: string };

export const GET = userRoute<P>(async ({ session, params }) => ok(await getGrouping(session.userId, params.id)));

export const PUT = userRoute<P>(async ({ req, session, params }) => {
  await saveGrouping(session.userId, params.id, groupingSaveSchema.parse(await readJson(req)));
  return ok({ success: true });
});

export const DELETE = userRoute<P>(async ({ session, params }) => {
  await deleteGrouping(session.userId, params.id);
  return ok({ success: true });
});
