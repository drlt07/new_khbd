import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { studentInputSchema } from "@/schemas/student";
import { createStudent, listStudents } from "@/server/services/student.service";
import { assertClassOwner } from "@/server/services/authz";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ req, session, params }) => {
  await assertClassOwner(session.teacherId, params.id);
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  return ok(await listStudents(session.teacherId, { classId: params.id, q }));
});

export const POST = teacherRoute<P>(async ({ req, session, params }) => {
  const input = studentInputSchema.parse(await readJson(req));
  const s = await createStudent(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "student.create", entityType: "Student", entityId: s.id, metadata: { classId: params.id } });
  return ok(s, { status: 201 });
});
