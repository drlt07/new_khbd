import { ok, readJson, userRoute } from "@/lib/api";
import { resourceSchema } from "@/schemas/resource";
import { deleteResource, updateResource } from "@/server/services/resource.service";

type P = { id: string };
export const PUT = userRoute<P>(async ({ req, session, params }) => ok(await updateResource(session.userId, params.id, resourceSchema.parse(await readJson(req)))));
export const DELETE = userRoute<P>(async ({ session, params }) => { await deleteResource(session.userId, params.id); return ok({ success: true }); });
