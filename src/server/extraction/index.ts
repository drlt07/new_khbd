import "server-only";
import ExcelJS from "exceljs";
import type { FileKind } from "@/server/storage/file-types";

/**
 * Trích xuất văn bản/bảng KHÔNG dùng AI (thư viện xác định).
 * AI Document Extraction (Sprint 4) sẽ dùng kết quả này làm đầu vào.
 */
export type TableSheet = { name: string; headers: string[]; rows: string[][]; totalRows: number };
export type ExtractionResult = {
  text: string;
  tables?: TableSheet[];
  pageCount?: number;
  note?: string;
};

const MAX_TEXT = 200_000;
const MAX_TABLE_ROWS = 300;

function cellText(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("error" in v) return "";
  }
  return String(v).trim();
}

function tablesToText(tables: TableSheet[]) {
  return tables
    .map((t) => [`# ${t.name}`, t.headers.join("\t"), ...t.rows.map((r) => r.join("\t"))].join("\n"))
    .join("\n\n");
}

export function parseCSV(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const first = clean.split(/\r?\n/)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.map((r) => r.map((f) => f.trim())).filter((r) => r.some(Boolean));
}

function toSheet(name: string, matrix: string[][]): TableSheet {
  const [headers = [], ...rows] = matrix;
  return { name, headers, rows: rows.slice(0, MAX_TABLE_ROWS), totalRows: rows.length };
}

async function extractXlsx(buf: Buffer): Promise<ExtractionResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ArrayBuffer);
  const tables = wb.worksheets.map((ws) => {
    const matrix: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (r) => {
      const vals: string[] = [];
      for (let c = 1; c <= ws.columnCount; c++) vals.push(cellText(r.getCell(c).value));
      if (vals.some(Boolean)) matrix.push(vals);
    });
    return toSheet(ws.name, matrix);
  }).filter((t) => t.headers.length || t.rows.length);
  return { text: tablesToText(tables), tables };
}

async function extractPdf(buf: Buffer): Promise<ExtractionResult> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const t = String(text).trim();
  return {
    text: t,
    pageCount: totalPages,
    note: t.length < 20 ? "PDF gần như không có lớp văn bản (có thể là bản scan) — cần OCR/AI ở Sprint 4." : undefined,
  };
}

async function extractDocx(buf: Buffer): Promise<ExtractionResult> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: buf });
  return { text: value.replace(/\n{3,}/g, "\n\n").trim() };
}

export async function extractContent(kind: FileKind, buf: Buffer): Promise<ExtractionResult> {
  let result: ExtractionResult;
  switch (kind) {
    case "pdf": result = await extractPdf(buf); break;
    case "docx": result = await extractDocx(buf); break;
    case "xlsx": result = await extractXlsx(buf); break;
    case "csv": {
      const tables = [toSheet("CSV", parseCSV(buf.toString("utf8")))];
      result = { text: tablesToText(tables), tables };
      break;
    }
    case "png":
    case "jpg":
      result = { text: "", note: "Ảnh minh chứng được lưu để giáo viên xem. Chưa trích xuất văn bản từ ảnh (cần OCR/AI — Sprint 4)." };
      break;
  }
  if (result.text.length > MAX_TEXT) {
    result.text = result.text.slice(0, MAX_TEXT);
    result.note = [result.note, `Văn bản quá dài — chỉ lưu ${MAX_TEXT.toLocaleString("vi-VN")} ký tự đầu.`].filter(Boolean).join(" ");
  }
  return result;
}
