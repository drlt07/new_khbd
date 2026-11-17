import { ok, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { evidenceFilterSchema, evidenceMetaSchema } from "@/schemas/evidence";
import { listEvidence, uploadEvidenceFiles } from "@/server/services/evidence.service";

export const GET = teacherRoute(async ({ req, session }) => {
  const filter = evidenceFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listEvidence(session.teacherId, filter));
});

/** multipart/form-data: files[] + classId, type, subjectId, studentIds[], criteriaIds[], title, description, collectedAt */
export const POST = teacherRoute(async ({ req, session }) => {
  const form = await req.formData();
  const str = (k: string) => (form.get(k) as string | null) ?? undefined;
  const meta = evidenceMetaSchema.parse({
    classId: str("classId"),
    subjectId: str("subjectId"),
    type: str("type"),
    title: str("title"),
    description: str("description"),
    collectedAt: str("collectedAt"),
    studentIds: form.getAll("studentIds").map(String),
    criteriaIds: form.getAll("criteriaIds").map(String),
  });
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  const outcomes = await uploadEvidenceFiles(session.teacherId, meta, files);

  for (const o of outcomes.filter((o) => o.ok)) {
    if (!o.ok) continue;
    await writeAudit({ userId: session.userId, action: "evidence.upload", entityType: "StudentEvidence", entityId: o.evidenceId, metadata: { fileName: o.fileName } });
    for (const studentId of meta.studentIds) {
      await writeAudit({ userId: session.userId, action: "evidence.attach", entityType: "Student", entityId: studentId, metadata: { evidenceId: o.evidenceId, title: o.fileName } });
    }
  }
  const anyOk = outcomes.some((o) => o.ok);
  return ok(outcomes, { status: anyOk ? 201 : 422 });
});
