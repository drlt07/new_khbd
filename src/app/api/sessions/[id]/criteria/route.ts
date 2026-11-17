import { ok, readJson, userRoute } from "@/lib/api";
import { criteriaSaveSchema } from "@/schemas/session";
import { saveCriteria } from "@/server/services/session.service";

export const PUT = userRoute<{ id: string }>(async ({ req, session, params }) => ok(await saveCriteria(session.userId, params.id, criteriaSaveSchema.parse(await readJson(req)))));
