import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { collectionInputSchema } from "@/schemas/knowledge";
import { createCollection, listCollections } from "@/server/knowledge/knowledge.service";

export const GET = teacherRoute(async ({ session }) => ok(await listCollections(session.teacherId)));

export const POST = teacherRoute(async ({ req, session }) => {
  const input = collectionInputSchema.parse(await readJson(req));
  const c = await createCollection(session.teacherId, input);
  await writeAudit({ userId: session.userId, action: "knowledge.collection.create", entityType: "KnowledgeCollection", entityId: c.id, metadata: { name: c.name } });
  return ok(c, { status: 201 });
});
