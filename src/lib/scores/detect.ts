/**
 * Nhận diện cấu trúc bảng điểm bất kỳ (vnEdu, SMAS, tự lập): dòng tiêu đề (1–3 dòng, ô gộp),
 * cột họ tên, cột mã học sinh, các cột điểm thang 10. Hàm thuần — có kiểm thử.
 */
import { normText } from "@/lib/grouping/match";

export type ScoreComponent = "TX" | "GK" | "CK" | "TB" | "OTHER";
export const COMPONENT_LABEL: Record<ScoreComponent, string> = {
  TX: "Thường xuyên", GK: "Giữa kỳ", CK: "Cuối kỳ", TB: "Trung bình môn", OTHER: "Điểm khác",
};
/** Hệ số mặc định khi tính điểm trung bình */
export const COMPONENT_WEIGHT: Record<ScoreComponent, number> = { TX: 1, GK: 2, CK: 3, TB: 3, OTHER: 1 };

export type DetectedColumn = {
  index: number;
  header: string;
  subject: string | null;
  component: ScoreComponent;
  weight: number;
  sample: string[];
};

export type DetectedRow = { rowNumber: number; fullName: string; code: string | null; scores: Record<number, number> };

export type Detection = {
  headerRows: number[];
  nameColumn: string;
  codeColumn: string | null;
  scoreColumns: DetectedColumn[];
  subjects: string[];
  rows: DetectedRow[];
};

const SUBJECTS: [string, RegExp][] = [
  ["Ngữ văn", /(^| )(ngu van|van)( |$)/], ["Toán", /(^| )toan( |$)/], ["Tiếng Anh", /(^| )(tieng anh|anh|ngoai ngu)( |$)/],
  ["Vật lí", /(^| )(vat li|vat ly)( |$)/], ["Hóa học", /(^| )(hoa hoc|hoa)( |$)/], ["Sinh học", /(^| )(sinh hoc|sinh)( |$)/],
  ["Lịch sử", /(^| )(lich su|su)( |$)/], ["Địa lí", /(^| )(dia li|dia ly|dia)( |$)/], ["Tin học", /(^| )(tin hoc|tin)( |$)/],
  ["GD KT&PL", /(gd ?kt|gdcd|kinh te|phap luat)/], ["Công nghệ", /(^| )cong nghe( |$)/],
];

export function detectSubject(h: string) {
  const n = normText(h).replace(/[^a-z0-9 ]/g, " ");
  return SUBJECTS.find(([, re]) => re.test(n))?.[0] ?? null;
}

export function detectComponent(h: string): ScoreComponent {
  const s = ` ${normText(h).replace(/[^a-z0-9 ]/g, " ")} `;
  // Viết tắt kiểu vnEdu/SMAS: ĐĐGtx, ĐĐGgk, ĐĐGck, ĐTB
  if (/ (d|dd)?tb|trung binh| ca nam| tong ket/.test(s)) return "TB";
  if (/ (ddg|dg)?gk[0-9]? |giua (ky|ki|hk|hoc ky)/.test(s)) return "GK";
  if (/ (ddg|dg)?ck[0-9]? |cuoi (ky|ki|hk|hoc ky)/.test(s)) return "CK";
  if (/ (ddg|dg)?tx[0-9]* |thuong xuyen|mieng| 15 ?p| kt ?15/.test(s)) return "TX";
  return "OTHER";
}

const num = (v: string) => {
  const t = v.trim().replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(t) ? parseFloat(t) : null;
};
const isScore = (x: number | null) => x != null && x >= 0 && x <= 10;
const nonEmpty = (v: string | undefined) => !!v && v.trim() !== "";

const HEADER_WORDS = / (diem|lop|truong|mon|stt|danh sach|ngay sinh|tong|giao vien|hoc ky|nam hoc|trung binh|thuong xuyen|giua ky|cuoi ky|nhan xet|ghi chu|xep loai|hoc luc|ho va ten|ho ten|nguoi lap|hieu truong|ky ten) /;

export function isNameLike(v: string) {
  const t = v.trim();
  if (!t || t.length > 40 || /\d/.test(t)) return false;
  const w = t.split(/\s+/);
  if (w.length < 2 || w.length > 6 || !w.every((x) => /^\p{L}/u.test(x))) return false;
  return !HEADER_WORDS.test(` ${normText(t)} `);
}

function rowInfo(row: string[] = []) {
  let names = 0, nums = 0, ne = 0;
  const uniq = new Set<string>();
  for (const v of row) {
    if (nonEmpty(v)) { ne++; uniq.add(v.trim()); }
    if (isNameLike(v ?? "")) names++;
    if (isScore(num(v ?? ""))) nums++;
  }
  return { names, nums, ne, uniq: uniq.size };
}

export class DetectError extends Error {}

export function detectScoreTable(table: string[][]): Detection {
  const width = Math.max(0, ...table.map((r) => r.length));
  const rows = table.map((r) => Array.from({ length: width }, (_, i) => (r[i] ?? "").trim()));

  // Dòng dữ liệu đầu tiên: có họ tên + điểm, và dòng tiếp theo cũng vậy
  let ds = -1;
  for (let r = 0; r < rows.length - 1; r++) {
    const a = rowInfo(rows[r]), b = rowInfo(rows[r + 1]);
    if (a.names >= 1 && a.nums >= 1 && b.names >= 1 && b.nums >= 1) { ds = r; break; }
  }
  if (ds < 0) throw new DetectError("Không tìm thấy danh sách học sinh. Bảng cần có cột họ tên và ít nhất một cột điểm (thang 10).");

  const headerRows: number[] = [];
  for (let r = ds - 1; r >= Math.max(0, ds - 3); r--) {
    const a = rowInfo(rows[r]);
    if (a.ne >= 2 && a.uniq >= 2) headerRows.unshift(r); else break;
  }
  const dataRows = rows.slice(ds).map((r, i) => ({ r, rowNumber: ds + i + 1 })).filter(({ r }) => r.some(nonEmpty));

  const cols = Array.from({ length: width }, (_, c) => {
    const parts: string[] = [];
    for (const hr of headerRows) { const v = rows[hr][c]; if (v && !parts.includes(v)) parts.push(v); }
    const header = parts.join(" · ") || `Cột ${c + 1}`;
    const hn = ` ${normText(parts.join(" ")).replace(/[^a-z0-9 ]/g, " ")} `;
    const vals = dataRows.map(({ r }) => r[c]);
    const nums = vals.filter(nonEmpty).map(num).filter((x): x is number => x != null);
    const n = Math.max(1, dataRows.length);
    return {
      c, header, hn,
      nameFrac: vals.filter((v) => isNameLike(v)).length / n,
      numFrac: nums.length / n,
      allScores: nums.every((x) => isScore(x)),
      sequence: nums.length >= 3 && nums.every((x, i) => x === i + 1),
      sample: vals.filter(nonEmpty).slice(0, 3),
    };
  });

  const ignored = (x: (typeof cols)[number]) =>
    x.sequence || / (stt|tt|so tt) /.test(x.hn) || /(ngay|nam sinh|vang|nghi|buoi|tuoi|sdt|dien thoai)/.test(x.hn);

  const nameCol = cols.filter((x) => !ignored(x)).sort((a, b) => b.nameFrac - a.nameFrac)[0];
  if (!nameCol || nameCol.nameFrac < 0.4) throw new DetectError("Không xác định được cột họ tên học sinh.");
  // "Họ" và "Tên" tách 2 cột
  const next = cols[nameCol.c + 1];
  const splitName = next && /^ ho /.test(nameCol.hn) && !/ ten /.test(nameCol.hn) && /^ ten /.test(next.hn);
  const codeCol = cols.find((x) => x.c !== nameCol.c && / ma /.test(x.hn) && /(hs|hoc sinh|dinh danh| ma )/.test(x.hn));

  const scoreColumns: DetectedColumn[] = cols
    .filter((x) => x.c !== nameCol.c && x.c !== codeCol?.c && !(splitName && x.c === next!.c) && !ignored(x) && x.numFrac >= 0.5 && x.allScores)
    .map((x) => {
      const component = detectComponent(x.header);
      return { index: x.c, header: x.header, subject: detectSubject(x.header), component, weight: COMPONENT_WEIGHT[component], sample: x.sample };
    });
  if (!scoreColumns.length) throw new DetectError("Không tìm thấy cột điểm nào (giá trị từ 0 đến 10).");

  const out: DetectedRow[] = [];
  for (const { r, rowNumber } of dataRows) {
    const fullName = (splitName ? `${r[nameCol.c]} ${r[next!.c]}` : r[nameCol.c]).replace(/\s+/g, " ").trim();
    if (!isNameLike(fullName)) continue;
    const scores: Record<number, number> = {};
    for (const sc of scoreColumns) { const x = num(r[sc.index]); if (isScore(x)) scores[sc.index] = x!; }
    out.push({ rowNumber, fullName, code: codeCol ? r[codeCol.c] || null : null, scores });
  }

  return {
    headerRows: headerRows.map((r) => r + 1),
    nameColumn: splitName ? `${nameCol.header} + ${next!.header}` : nameCol.header,
    codeColumn: codeCol?.header ?? null,
    scoreColumns,
    subjects: [...new Set(scoreColumns.map((c) => c.subject).filter((x): x is string => !!x))],
    rows: out,
  };
}
