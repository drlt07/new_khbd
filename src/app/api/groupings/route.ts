import { ok, readJson, userRoute } from "@/lib/api";
import { groupingCreateSchema } from "@/schemas/grouping";
import { createGrouping, listGroupings } from "@/server/services/grouping.service";

export const GET = userRoute(async ({ session }) => ok(await listGroupings(session.userId)));

export const POST = userRoute(async ({ req, session }) =>
  ok(await createGrouping(session.userId, groupingCreateSchema.parse(await readJson(req))), { status: 201 }));
