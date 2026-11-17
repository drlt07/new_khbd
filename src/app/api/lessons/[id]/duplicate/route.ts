import { ok, userRoute } from "@/lib/api";
import { duplicateLesson } from "@/server/services/lesson.service";

export const POST = userRoute<{ id: string }>(async ({ session, params }) => ok(await duplicateLesson(session.userId, params.id)));
