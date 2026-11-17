import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { evidenceUpdateSchema } from "@/schemas/evidence";
import { deleteEvidence, getEvidence, updateEvidence } from "@/server/services/evidence.service";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ session, params }) => ok(await getEvidence(session.teacherId, params.id)));

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = evidenceUpdateSchema.parse(await readJson(req));
  const before = await getEvidence(session.teacherId, params.id);
  const ev = await updateEvidence(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "evidence.update", entityType: "StudentEvidence", entityId: ev.id, metadata: { fields: Object.keys(input) } });
  if (input.studentIds) {
    const prev = new Set(before.students.map((s) => s.studentId));
    const next = new Set(input.studentIds);
    for (const id of next) if (!prev.has(id)) await writeAudit({ userId: session.userId, action: "evidence.attach", entityType: "Student", entityId: id, metadata: { evidenceId: ev.id, title: ev.title } });
    for (const id of prev) if (!next.has(id)) await writeAudit({ userId: session.userId, action: "evidence.detach", entityType: "Student", entityId: id, metadata: { evidenceId: ev.id, title: ev.title } });
  }
  return ok(ev);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const before = await getEvidence(session.teacherId, params.id);
  await deleteEvidence(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "evidence.delete", entityType: "StudentEvidence", entityId: params.id, metadata: { title: before.title } });
  for (const s of before.students) {
    await writeAudit({ userId: session.userId, action: "evidence.detach", entityType: "Student", entityId: s.studentId, metadata: { evidenceId: params.id, title: before.title } });
  }
  return ok({ success: true });
});
