import { ok, readJson, userRoute } from "@/lib/api";
import { lessonCreateSchema } from "@/schemas/lesson";
import { createLesson, listLessons } from "@/server/services/lesson.service";

export const GET = userRoute(async ({ req, session }) => ok(await listLessons(session.userId, { classId: new URL(req.url).searchParams.get("classId") ?? undefined })));
export const POST = userRoute(async ({ req, session }) => ok(await createLesson(session.userId, lessonCreateSchema.parse(await readJson(req))), { status: 201 }));
