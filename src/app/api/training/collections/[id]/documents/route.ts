import { ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { uploadDocuments } from "@/server/knowledge/knowledge.service";

export const POST = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const outcomes = await uploadDocuments(session.teacherId, params.id, files);
  for (const o of outcomes) {
    if (o.ok) await writeAudit({ userId: session.userId, action: "knowledge.document.upload", entityType: "KnowledgeDocument", entityId: o.documentId, metadata: { fileName: o.fileName, status: o.status } });
  }
  return ok(outcomes, { status: outcomes.some((o) => o.ok) ? 201 : 422 });
});
