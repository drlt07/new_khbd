import { teacherRoute } from "@/lib/api";
import { readEvidenceFile } from "@/server/services/evidence.service";

/** Phục vụ tệp minh chứng qua route có kiểm tra quyền — không có URL công khai. */
export const GET = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const { ev, data } = await readEvidenceFile(session.teacherId, params.id);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const inlineable = ev.mimeType === "application/pdf" || ev.mimeType!.startsWith("image/");
  const disposition = download || !inlineable ? "attachment" : "inline";
  const ascii = (ev.fileName ?? "tep").replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": ev.mimeType!,
      "Content-Length": String(data.length),
      "Content-Disposition": `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(ev.fileName ?? "tep")}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      // Ảnh: chặn mọi tài nguyên phụ. PDF: không dùng sandbox vì trình xem PDF của Chrome bị chặn trong khung sandbox.
      ...(ev.mimeType!.startsWith("image/") ? { "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox" } : {}),
    },
  });
});
