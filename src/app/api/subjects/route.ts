import { ok, teacherRoute } from "@/lib/api";
import { listSubjectsForTeacher } from "@/server/services/subject.service";

export const GET = teacherRoute(async ({ session }) => ok(await listSubjectsForTeacher(session.teacherId)));
