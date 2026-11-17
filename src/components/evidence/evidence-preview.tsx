import { FileText, ImageIcon } from "lucide-react";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { TableSheet } from "@/server/extraction";

/** Xem trước minh chứng: ảnh, PDF (trình xem của trình duyệt), bảng (XLSX/CSV), văn bản (DOCX / nhận xét). */
export function EvidencePreview({
  id, mimeType, title, text, tables,
}: { id: string; mimeType: string | null; title: string; text: string | null; tables: TableSheet[] }) {
  const fileUrl = `/api/evidence/${id}/file`;

  if (mimeType?.startsWith("image/")) {
    return (
      <div className="flex justify-center rounded-lg border bg-muted/40 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- tệp riêng tư phục vụ qua route có kiểm tra quyền */}
        <img src={fileUrl} alt={`Minh chứng: ${title}`} className="max-h-[32rem] max-w-full rounded object-contain" />
      </div>
    );
  }
  if (mimeType === "application/pdf") {
    return <iframe src={fileUrl} title={`Xem trước ${title}`} className="h-[36rem] w-full rounded-lg border" />;
  }
  if (tables.length) {
    return (
      <div className="space-y-4">
        {tables.map((t) => (
          <div key={t.name} className="space-y-1.5">
            <p className="text-sm font-medium">{t.name} <span className="font-normal text-muted-foreground">· {t.totalRows} dòng{t.totalRows > t.rows.length ? ` (hiển thị ${t.rows.length})` : ""}</span></p>
            <div className="max-h-[28rem] overflow-auto rounded-lg border">
              <Table>
                <THead><tr>{t.headers.map((h, i) => <TH key={i}>{h || `Cột ${i + 1}`}</TH>)}</tr></THead>
                <TBody>{t.rows.map((r, i) => <TR key={i}>{t.headers.map((_, j) => <TD key={j}>{r[j]}</TD>)}</TR>)}</TBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (text) {
    return <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">{text}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-sm text-muted-foreground">
      {mimeType ? <FileText className="size-6" /> : <ImageIcon className="size-6" />}
      Không có nội dung để xem trước.
    </div>
  );
}
