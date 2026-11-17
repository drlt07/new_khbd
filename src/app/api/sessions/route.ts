import { ok, readJson, userRoute } from "@/lib/api";
import { sessionCreateSchema } from "@/schemas/session";
import { createSession, listSessions } from "@/server/services/session.service";

export const GET = userRoute(async ({ req, session }) => ok(await listSessions(session.userId, new URL(req.url).searchParams.get("classId") ?? undefined)));
export const POST = userRoute(async ({ req, session }) => ok(await createSession(session.userId, sessionCreateSchema.parse(await readJson(req))), { status: 201 }));
