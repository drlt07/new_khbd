import { teacherRoute } from "@/lib/api";
import { buildImportTemplate } from "@/server/services/import.service";

export const GET = teacherRoute(async () => {
  const buf = await buildImportTemplate();
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mau-danh-sach-hoc-sinh.xlsx"',
    },
  });
});
