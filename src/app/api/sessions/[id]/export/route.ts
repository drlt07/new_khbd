import { userRoute } from "@/lib/api";
import { exportSessionXlsx } from "@/server/services/session.service";

export const GET = userRoute<{ id: string }>(async ({ session, params }) =>
  new Response(new Uint8Array(await exportSessionXlsx(session.userId, params.id)), {
    headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="ho-so-nhom.xlsx"' },
  }));
