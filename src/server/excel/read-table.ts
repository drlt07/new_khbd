import "server-only";
import ExcelJS from "exceljs";
import { ApiError } from "@/lib/api";

export function cellToString(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v) return cellToString(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
  }
  return String(v).trim();
}

/** Bộ đọc CSV tối giản, hỗ trợ dấu ngoặc kép và dấu phân cách , hoặc ; */
function parseCSV(text: string): string[][] {
  const clean = text.replace(/^﻿/, "");
  const firstLine = clean.split(/\r?\n/)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
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
  return rows.map((r) => r.map((f) => f.trim()));
}

/** Đọc trang tính đầu tiên của .xlsx / .csv thành bảng chuỗi. Ô gộp lấy giá trị của ô gốc. */
export async function readTable(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());
  if (name.endsWith(".csv")) return parseCSV(buf.toString("utf8"));
  if (name.endsWith(".xlsx")) {
    // Kiểm tra chữ ký ZIP (PK\x03\x04) — không tin vào phần mở rộng tệp
    if (buf.subarray(0, 4).toString("hex") !== "504b0304") throw new ApiError(422, "Tệp không phải định dạng Excel (.xlsx) hợp lệ");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new ApiError(422, "Tệp Excel không có trang tính nào");
    const out: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (r) => {
      const values: string[] = [];
      for (let c = 1; c <= ws.columnCount; c++) values.push(cellToString(r.getCell(c).value));
      out.push(values);
    });
    return out;
  }
  throw new ApiError(422, "Chỉ hỗ trợ tệp .xlsx hoặc .csv");
}

