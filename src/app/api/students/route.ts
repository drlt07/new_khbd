import { ok, userRoute } from "@/lib/api";
import { listStudents } from "@/server/services/student.service";

export const GET = userRoute(async ({ req, session }) => {
  const sp = new URL(req.url).searchParams;
  return ok(await listStudents(session.userId, { classId: sp.get("classId") ?? undefined, q: sp.get("q") ?? undefined }));
});
