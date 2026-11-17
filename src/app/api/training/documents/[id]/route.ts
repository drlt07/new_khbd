import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { documentUpdateSchema } from "@/schemas/knowledge";
import { deleteDocument, getDocument, updateDocument } from "@/server/knowledge/knowledge.service";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ session, params }) => ok(await getDocument(session.teacherId, params.id)));

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = documentUpdateSchema.parse(await readJson(req));
  const d = await updateDocument(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "knowledge.document.update", entityType: "KnowledgeDocument", entityId: d.id, metadata: { fields: Object.keys(input) } });
  return ok(d);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const d = await deleteDocument(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "knowledge.document.delete", entityType: "KnowledgeDocument", entityId: d.id, metadata: { title: d.title } });
  return ok({ success: true });
});
