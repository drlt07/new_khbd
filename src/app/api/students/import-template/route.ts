import { userRoute } from "@/lib/api";
import { buildImportTemplate } from "@/server/services/import.service";

export const GET = userRoute(async () =>
  new Response(new Uint8Array(await buildImportTemplate()), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mau-danh-sach-hoc-sinh.xlsx"',
    },
  }));
