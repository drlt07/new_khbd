import { ok, readJson, userRoute } from "@/lib/api";
import { studentInputSchema } from "@/schemas/student";
import { createStudent } from "@/server/services/student.service";

export const POST = userRoute<{ id: string }>(async ({ req, session, params }) =>
  ok(await createStudent(session.userId, params.id, studentInputSchema.parse(await readJson(req))), { status: 201 }));
