import "server-only";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB / tệp
export const MAX_FILES_PER_UPLOAD = 10;

export type FileKind = "pdf" | "docx" | "xlsx" | "csv" | "png" | "jpg";

export const FILE_KIND_META: Record<FileKind, { mime: string; ext: string; label: string }> = {
  pdf: { mime: "application/pdf", ext: "pdf", label: "PDF" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: "docx", label: "Word" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: "xlsx", label: "Excel" },
  csv: { mime: "text/csv", ext: "csv", label: "CSV" },
  png: { mime: "image/png", ext: "png", label: "Ảnh PNG" },
  jpg: { mime: "image/jpeg", ext: "jpg", label: "Ảnh JPG" },
};

/**
 * Xác định loại tệp từ NỘI DUNG (magic bytes), đối chiếu với phần mở rộng.
 * Không tin vào Content-Type do trình duyệt gửi lên.
 */
export function detectFileKind(name: string, buf: Buffer): { kind: FileKind } | { error: string } {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const head = buf.subarray(0, 8);
  const hex = head.toString("hex");

  const sniffed: FileKind | null = (() => {
    if (buf.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
    if (hex.startsWith("89504e470d0a1a0a")) return "png";
    if (hex.startsWith("ffd8ff")) return "jpg";
    if (hex.startsWith("504b0304")) {
      // OOXML: phân biệt Word / Excel qua tên phần tử trong gói zip
      const latin = buf.toString("latin1");
      if (latin.includes("word/")) return "docx";
      if (latin.includes("xl/")) return "xlsx";
      return null;
    }
    if (ext === "csv" && !buf.includes(0)) {
      try {
        new TextDecoder("utf-8", { fatal: true }).decode(buf);
        return "csv";
      } catch {
        return null;
      }
    }
    return null;
  })();

  if (!sniffed) return { error: "Định dạng không được hỗ trợ (chỉ nhận PDF, DOCX, XLSX, CSV, PNG, JPG)" };
  const okExt = sniffed === "jpg" ? ["jpg", "jpeg"] : [sniffed];
  if (!okExt.includes(ext)) return { error: `Nội dung tệp là ${FILE_KIND_META[sniffed].label} nhưng phần mở rộng là .${ext}` };
  return { kind: sniffed };
}

export function kindFromMime(mime: string | null | undefined): FileKind | null {
  const entry = Object.entries(FILE_KIND_META).find(([, m]) => m.mime === mime);
  return (entry?.[0] as FileKind) ?? null;
}
