import { ok, readJson, userRoute } from "@/lib/api";
import { classInputSchema } from "@/schemas/class";
import { createClass, listClasses } from "@/server/services/class.service";

export const GET = userRoute(async ({ session }) => ok(await listClasses(session.userId)));

export const POST = userRoute(async ({ req, session }) =>
  ok(await createClass(session.userId, classInputSchema.parse(await readJson(req))), { status: 201 }));
