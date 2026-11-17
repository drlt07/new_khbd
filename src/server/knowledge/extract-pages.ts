import "server-only";
import type { FileKind } from "@/server/storage/file-types";

/** Trích văn bản THEO TRANG (PDF) để trích dẫn được số trang; DOCX coi là một trang. */
export async function extractPages(kind: FileKind, buf: Buffer): Promise<string[]> {
  if (kind === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: false });
    return text.map(String);
  }
  if (kind === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return [value];
  }
  throw new Error("Kho tài liệu chỉ nhận PDF hoặc DOCX");
}
