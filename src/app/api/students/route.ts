import { ok, teacherRoute } from "@/lib/api";
import { studentFilterSchema } from "@/schemas/student";
import { listStudents } from "@/server/services/student.service";

export const GET = teacherRoute(async ({ req, session }) => {
  const filter = studentFilterSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listStudents(session.teacherId, filter));
});
