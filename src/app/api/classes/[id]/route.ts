import { ok, readJson, userRoute } from "@/lib/api";
import { classInputSchema } from "@/schemas/class";
import { deleteClass, updateClass } from "@/server/services/class.service";

type P = { id: string };

export const PATCH = userRoute<P>(async ({ req, session, params }) =>
  ok(await updateClass(session.userId, params.id, classInputSchema.parse(await readJson(req)))));

export const DELETE = userRoute<P>(async ({ session, params }) => {
  await deleteClass(session.userId, params.id);
  return ok({ success: true });
});
