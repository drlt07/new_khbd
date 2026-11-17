import { ok, readJson, userRoute } from "@/lib/api";
import { resourceSchema } from "@/schemas/resource";
import { createResource, listResources } from "@/server/services/resource.service";

export const GET = userRoute(async ({ req, session }) => ok(await listResources(session.userId, new URL(req.url).searchParams.get("q") ?? undefined)));
export const POST = userRoute(async ({ req, session }) => ok(await createResource(session.userId, resourceSchema.parse(await readJson(req))), { status: 201 }));
