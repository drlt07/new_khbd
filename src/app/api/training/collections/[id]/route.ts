import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { collectionUpdateSchema } from "@/schemas/knowledge";
import { deleteCollection, getCollection, updateCollection } from "@/server/knowledge/knowledge.service";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ session, params }) => ok(await getCollection(session.teacherId, params.id)));

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = collectionUpdateSchema.parse(await readJson(req));
  const c = await updateCollection(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "knowledge.collection.update", entityType: "KnowledgeCollection", entityId: c.id });
  return ok(c);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const c = await deleteCollection(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "knowledge.collection.delete", entityType: "KnowledgeCollection", entityId: c.id, metadata: { name: c.name } });
  return ok({ success: true });
});
