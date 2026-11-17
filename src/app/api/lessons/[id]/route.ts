import { ok, readJson, userRoute } from "@/lib/api";
import { lessonSaveSchema } from "@/schemas/lesson";
import { deleteLesson, getLesson, saveLesson } from "@/server/services/lesson.service";

type P = { id: string };
export const GET = userRoute<P>(async ({ session, params }) => ok(await getLesson(session.userId, params.id)));
export const PUT = userRoute<P>(async ({ req, session, params }) => { await saveLesson(session.userId, params.id, lessonSaveSchema.parse(await readJson(req))); return ok({ success: true }); });
export const DELETE = userRoute<P>(async ({ session, params }) => { await deleteLesson(session.userId, params.id); return ok({ success: true }); });
