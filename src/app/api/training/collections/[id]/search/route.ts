import { ok, teacherRoute } from "@/lib/api";
import { knowledgeSearchSchema } from "@/schemas/knowledge";
import { searchKnowledge } from "@/server/knowledge/knowledge.service";

export const GET = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const { q, lesson, limit } = knowledgeSearchSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await searchKnowledge(session.teacherId, { collectionId: params.id }, q, { lesson, limit }));
});
