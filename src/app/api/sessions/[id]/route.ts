import { ok, readJson, userRoute } from "@/lib/api";
import { sessionDataSchema } from "@/schemas/session";
import { deleteSession, getSession, updateSessionData } from "@/server/services/session.service";

type P = { id: string };
export const GET = userRoute<P>(async ({ session, params }) => ok(await getSession(session.userId, params.id)));
export const PATCH = userRoute<P>(async ({ req, session, params }) => ok(await updateSessionData(session.userId, params.id, sessionDataSchema.parse(await readJson(req)))));
export const DELETE = userRoute<P>(async ({ session, params }) => { await deleteSession(session.userId, params.id); return ok({ success: true }); });
