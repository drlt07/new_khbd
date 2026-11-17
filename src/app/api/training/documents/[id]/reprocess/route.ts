import { ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { reprocessDocument } from "@/server/knowledge/knowledge.service";

export const POST = teacherRoute<{ id: string }>(async ({ session, params }) => {
  const r = await reprocessDocument(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "knowledge.document.reprocess", entityType: "KnowledgeDocument", entityId: params.id, metadata: r });
  return ok(r);
});
