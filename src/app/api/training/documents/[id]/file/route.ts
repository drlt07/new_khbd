import { teacherRoute } from "@/lib/api";
import { readDocumentFile } from "@/server/knowledge/knowledge.service";

/** Tệp tài liệu chỉ phục vụ cho chủ sở hữu (tài liệu có thể có bản quyền — không công khai). */
export const GET = teacherRoute<{ id: string }>(async ({ req, session, params }) => {
  const { doc, data } = await readDocumentFile(session.teacherId, params.id);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const disposition = download || doc.mimeType !== "application/pdf" ? "attachment" : "inline";
  const ascii = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(data.length),
      "Content-Disposition": `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
});
