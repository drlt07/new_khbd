import { ok, readJson, teacherRoute } from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { studentUpdateSchema } from "@/schemas/student";
import { deleteStudent, updateStudent } from "@/server/services/student.service";
import { getStudentProfile } from "@/server/services/profile.service";

type P = { id: string };

export const GET = teacherRoute<P>(async ({ session, params }) => ok(await getStudentProfile(session.teacherId, params.id)));

export const PATCH = teacherRoute<P>(async ({ req, session, params }) => {
  const input = studentUpdateSchema.parse(await readJson(req));
  const s = await updateStudent(session.teacherId, params.id, input);
  await writeAudit({ userId: session.userId, action: "student.update", entityType: "Student", entityId: s.id, metadata: { fields: Object.keys(input) } });
  return ok(s);
});

export const DELETE = teacherRoute<P>(async ({ session, params }) => {
  const s = await deleteStudent(session.teacherId, params.id);
  await writeAudit({ userId: session.userId, action: "student.delete", entityType: "Class", entityId: s.classId, metadata: { studentId: s.id, fullName: s.fullName } });
  return ok({ success: true });
});
