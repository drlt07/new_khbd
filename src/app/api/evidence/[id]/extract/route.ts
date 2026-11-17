import { ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { reExtract } from "@/server/services/evidence.service";

export const POST = teacherRoute<{ id: string }>(async ({ session, params }) => {
  const ev = await reExtract(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "evidence.extract", entityType: "StudentEvidence", entityId: ev.id, metadata: { status: ev.processingStatus } });
  return ok({ processingStatus: ev.processingStatus });
});
