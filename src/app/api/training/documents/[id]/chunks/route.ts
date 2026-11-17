import { z } from "zod";
import { ok, teacherRoute } from "@/lib/api";
import { listDocumentChunks } from "@/server/knowledge/knowledge.service";

const q = z.object({ lesson: z.string().max(60).optional(), page: z.coerce.number().int().min(1).default(1) });

export const GET = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const opts = q.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listDocumentChunks(session.teacherId, params.id, opts));
});
