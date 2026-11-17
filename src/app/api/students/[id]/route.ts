import { ok, readJson, userRoute } from "@/lib/api";
import { studentUpdateSchema } from "@/schemas/student";
import { deleteStudent, updateStudent } from "@/server/services/student.service";

type P = { id: string };

export const PATCH = userRoute<P>(async ({ req, session, params }) =>
  ok(await updateStudent(session.userId, params.id, studentUpdateSchema.parse(await readJson(req)))));

export const DELETE = userRoute<P>(async ({ session, params }) => {
  await deleteStudent(session.userId, params.id);
  return ok({ success: true });
});
