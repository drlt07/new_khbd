import { z } from "zod";
import { ok, readJson, userRoute } from "@/lib/api";
import { GROUPING_METHODS } from "@/schemas/grouping";
import { resuggest } from "@/server/services/grouping.service";

const schema = z.object({
  method: z.enum(GROUPING_METHODS),
  groupCount: z.coerce.number().int().min(2).max(20),
  studentIds: z.array(z.string()).min(2).max(200),
  seed: z.coerce.number().int().min(0).max(1_000_000_000),
});

/** Gợi ý chia lại — không lưu */
export const POST = userRoute<{ id: string }>(async ({ req, session, params }) =>
  ok(await resuggest(session.userId, params.id, schema.parse(await readJson(req)))));
