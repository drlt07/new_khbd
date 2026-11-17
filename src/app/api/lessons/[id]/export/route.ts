import { userRoute } from "@/lib/api";
import { exportLessonDocx } from "@/server/services/lesson.service";

export const GET = userRoute<{ id: string }>(async ({ session, params }) =>
  new Response(new Uint8Array(await exportLessonDocx(session.userId, params.id)), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": 'attachment; filename="ke-hoach-bai-day.docx"' },
  }));
