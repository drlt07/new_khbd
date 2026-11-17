import { userRoute } from "@/lib/api";
import { exportGroupingXlsx } from "@/server/services/grouping.service";

export const GET = userRoute<{ id: string }>(async ({ session, params }) =>
  new Response(new Uint8Array(await exportGroupingXlsx(session.userId, params.id)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="chia-nhom.xlsx"',
    },
  }));
