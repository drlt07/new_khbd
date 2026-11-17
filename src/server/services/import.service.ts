import "server-only";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { GENDERS, importRowSchema, type ImportRow } from "@/schemas/student";

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 500;

type ColumnKey = "fullName" | "studentCode" | "gender" | "notes" | "interests" | "strengths" | "needs";

/** Nhận diện cột theo tiêu đề (không dấu, không phân biệt hoa thường). */
const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  fullName: ["ho va ten", "ho ten", "hoten", "ten hoc sinh", "full name", "name"],
  studentCode: ["ma hoc sinh", "ma hs", "mahs", "ma", "student code", "code"],
  interests: ["so thich", "sothich", "interests"],
  strengths: ["the manh", "themanh", "strengths"],
  needs: ["can ho tro", "nhu cau ho tro", "kho khan", "needs"],
  gender: ["gioi tinh", "gioitinh", "gender"],
  notes: ["ghi chu", "ghichu", "notes", "note"],
};

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\(.*?\)/g, "").replace(/[*:]/g, "").trim();

/** "Vẽ, Thuyết trình; Viết" -> ["Vẽ", "Thuyết trình", "Viết"] */
const splitList = (v: string) => (v ? v.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 15) : []);

export type PreviewRow = {
  rowNumber: number;
  data: ImportRow | null;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
};

function cellToString(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v) return cellToString(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
  }
  return String(v).trim();
}

function parseGender(value: string): { gender: ImportRow["gender"]; warning?: string } {
  if (!value) return { gender: null };
  const n = normalize(value);
  if (["nam", "m", "male"].includes(n)) return { gender: "Nam" };
  if (["nu", "f", "female"].includes(n)) return { gender: "Nữ" };
  if (["khac", "other"].includes(n)) return { gender: "Khác" };
  return { gender: null, warning: `Giới tính "${value}" không nhận diện được — để trống` };
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

async function readTable(file: File): Promise<string[][]> {
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

export async function previewImport(classId: string, file: File) {
  if (file.size > IMPORT_MAX_BYTES) throw new ApiError(413, "Tệp vượt quá dung lượng cho phép (2 MB)");
  const table = await readTable(file);

  // Tìm dòng tiêu đề trong 10 dòng đầu
  let headerIdx = -1;
  let columns: Partial<Record<ColumnKey, number>> = {};
  for (let i = 0; i < Math.min(10, table.length); i++) {
    const map: Partial<Record<ColumnKey, number>> = {};
    table[i].forEach((h, idx) => {
      const n = normalize(h);
      for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [ColumnKey, string[]][]) {
        if (map[key] === undefined && aliases.includes(n)) map[key] = idx;
      }
    });
    if (map.fullName !== undefined) { headerIdx = i; columns = map; break; }
  }
  if (headerIdx < 0) throw new ApiError(422, 'Không tìm thấy cột "Họ và tên". Vui lòng dùng tệp mẫu.');

  const body = table.slice(headerIdx + 1).filter((r) => r.some((c) => c));
  if (body.length > IMPORT_MAX_ROWS) throw new ApiError(422, `Tối đa ${IMPORT_MAX_ROWS} học sinh mỗi lần nhập`);

  const existingCodes = new Set(
    (await prisma.student.findMany({ where: { classId, studentCode: { not: null } }, select: { studentCode: true } })).map((s) => s.studentCode),
  );
  const seenCodes = new Set<string>();
  const get = (r: string[], k: ColumnKey) => (columns[k] !== undefined ? (r[columns[k]!] ?? "").trim() : "");

  const rows: PreviewRow[] = body.map((r, i) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const raw = Object.fromEntries((Object.keys(HEADER_ALIASES) as ColumnKey[]).map((k) => [k, get(r, k)]));
    const g = parseGender(raw.gender);
    if (g.warning) warnings.push(g.warning);
    const code = raw.studentCode || null;
    if (code && existingCodes.has(code)) errors.push(`Mã "${code}" đã có trong lớp — sẽ bỏ qua`);
    else if (code && seenCodes.has(code)) errors.push(`Mã "${code}" bị trùng trong tệp`);
    if (code) seenCodes.add(code);

    const parsed = importRowSchema.safeParse({
      fullName: raw.fullName,
      studentCode: code,
      interests: splitList(raw.interests),
      strengths: splitList(raw.strengths),
      needs: splitList(raw.needs),
      gender: g.gender,
      notes: raw.notes || null,
    });
    if (!parsed.success) {
      if (!raw.fullName || raw.fullName.length < 2) errors.push("Thiếu họ và tên");
      else errors.push("Dữ liệu dòng không hợp lệ");
    }
    return { rowNumber: headerIdx + 2 + i, raw, data: parsed.success && !errors.length ? parsed.data : null, errors, warnings };
  });

  return {
    detectedColumns: Object.keys(columns),
    total: rows.length,
    valid: rows.filter((r) => r.data).length,
    rows,
  };
}

export async function buildImportTemplate() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Danh sách học sinh");
  ws.columns = [
    { header: "STT", width: 6 },
    { header: "Mã học sinh", width: 14 },
    { header: "Họ và tên*", width: 28 },
    { header: "Giới tính", width: 10 },
    { header: "Sở thích", width: 30 },
    { header: "Thế mạnh", width: 30 },
    { header: "Cần hỗ trợ", width: 30 },
    { header: "Ghi chú", width: 30 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.addRow([1, "HS001", "Nguyễn Văn A (ví dụ — xóa dòng này)", GENDERS[0], "Văn học, Thiết kế", "Thuyết trình", "Cần thêm thời gian", ""]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}
