/**
 * Diễn giải mô tả nhóm bằng lời của giáo viên thành tiêu chí phân nhóm (bộ máy quy tắc).
 * Ví dụ "Học sinh có năng lực tốt, khả năng tự học cao" -> mức điểm cao nhất của lớp + từ khóa "Tự học".
 * Kết quả luôn được hiển thị cho GV ("Hệ thống hiểu…") và GV có thể ghi đè bằng tiêu chí nâng cao.
 */
import { keywordMatches, normText, type GroupSpec } from "./match";

/** Mức năng lực: 3 = cao nhất … 0 = cần củng cố nền */
export type Level = 0 | 1 | 2 | 3;
export const LEVEL_LABEL: Record<Level, string> = { 3: "mức cao của lớp", 2: "mức khá của lớp", 1: "mức trung bình của lớp", 0: "mức cần củng cố của lớp" };

export type Interpretation = {
  level: Level | null;
  keywords: string[];
  forSupport: boolean;
  notes: string[]; // diễn giải bằng lời cho GV
};

export type GroupInput = {
  name: string;
  description: string | null;
  keywords: string[];
  scoreMin: number | null;
  scoreMax: number | null;
  forSupport: boolean;
  maxSize: number | null;
};

export type EffectiveCriteria = GroupSpec & { level: Level | null; source: string[] };

const has = (text: string, re: RegExp) => re.test(text);

export function detectLevel(raw: string): Level | null {
  // " kha " (khá) — loại trừ "khả năng" (kha nang)
  const t = ` ${normText(raw).replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ")} `;
  const kha = / kha (?!nang)/.test(t) || / kha$/.test(t.trim());
  if (has(t, / (yeu|kem|cung co|nen tang|kien thuc nen|hong kien thuc|chua dat|can ho tro nhieu|mat goc) /)) return 0;
  if (has(t, / (gioi|xuat sac|nang cao|mo rong|vuot troi|nang luc tot|hoc tot|kha nang cao|tu hoc cao|nang luc cao|tot) /)) return 3;
  if (kha) return 2;
  if (has(t, / (trung binh|can huong dan|chua vung|co ban) /)) return 1;
  return null;
}

/** Cụm từ thường gặp -> từ khóa đặc trưng (bổ sung cho từ vựng có sẵn trong lớp) */
const PHRASES: [RegExp, string][] = [
  [/tu hoc/, "Tự học"], [/sang tao|sang tac/, "Sáng tạo"], [/thuyet trinh|trinh bay/, "Thuyết trình"],
  [/phan tich/, "Phân tích"], [/lap luan|nghi luan|tranh bien/, "Lập luận"], [/hop tac|lam viec nhom/, "Hợp tác"],
  [/van dung/, "Vận dụng"], [/giai quyet van de/, "Giải quyết vấn đề"], [/tu duy logic|logic/, "Tư duy logic"],
  [/thiet ke|ve /, "Thiết kế"], [/lap trinh/, "Lập trình"], [/doc hieu/, "Đọc hiểu"], [/viet/, "Viết"],
];

export function interpretDescription(description: string | null, vocabulary: string[]): Interpretation {
  const text = description ?? "";
  const n = ` ${normText(text)} `;
  const level = detectLevel(text);
  const keywords = new Set<string>();
  for (const v of vocabulary) if (normText(v).length >= 3 && n.includes(` ${normText(v)}`)) keywords.add(v);
  for (const [re, kw] of PHRASES) if (re.test(n) && ![...keywords].some((k) => keywordMatches(k, kw))) keywords.add(kw);
  const forSupport = level === 0 || /can ho tro|ho tro|huong dan tung buoc|them thoi gian/.test(n);
  const notes: string[] = [];
  if (level != null) notes.push(`Điểm số ở ${LEVEL_LABEL[level]}`);
  if (keywords.size) notes.push(`Đặc trưng: ${[...keywords].join(", ")}`);
  if (forSupport) notes.push("Ưu tiên học sinh cần hỗ trợ");
  return { level, keywords: [...keywords], forSupport, notes };
}

/**
 * Đổi "mức" thành khoảng điểm theo phân bố thực tế của lớp: các mức xuất hiện trong bộ nhóm
 * chia lớp theo phân vị (VD 4 mức -> 4 phần), nên nhóm không bị trống vì ngưỡng cứng.
 */
export function levelRanges(levels: Level[], scores: number[]): Map<Level, { min: number | null; max: number | null }> {
  const uniq = [...new Set(levels)].sort((a, b) => a - b);
  const sorted = [...scores].sort((a, b) => a - b);
  const out = new Map<Level, { min: number | null; max: number | null }>();
  if (!uniq.length || !sorted.length) return out;
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * sorted.length) - 1))];
  uniq.forEach((lv, i) => {
    const lo = i === 0 ? null : Math.round(q(i / uniq.length) * 10) / 10 + 0.01;
    const hi = i === uniq.length - 1 ? null : Math.round(q((i + 1) / uniq.length) * 10) / 10 + 0.01;
    out.set(lv, { min: lo == null ? null : Math.round(lo * 100) / 100, max: hi == null ? null : Math.round(hi * 100) / 100 });
  });
  return out;
}

/** Tiêu chí hiệu lực của từng nhóm = tiêu chí GV đặt (ưu tiên) + diễn giải từ mô tả */
export function effectiveCriteria(groups: GroupInput[], vocabulary: string[], classScores: number[]): EffectiveCriteria[] {
  const interp = groups.map((g) => interpretDescription(`${g.name}. ${g.description ?? ""}`, vocabulary));
  const levels = interp.map((x) => x.level).filter((x): x is Level => x != null);
  const ranges = levelRanges(levels, classScores);
  return groups.map((g, i) => {
    const it = interp[i];
    const source: string[] = [];
    const explicitRange = g.scoreMin != null || g.scoreMax != null;
    const r = !explicitRange && it.level != null ? ranges.get(it.level) : undefined;
    if (explicitRange) source.push("Khoảng điểm do GV đặt");
    else if (r) source.push(`Điểm theo ${LEVEL_LABEL[it.level!]}`);
    else if (it.level != null) source.push(`${LEVEL_LABEL[it.level]} (chưa có bảng điểm để áp dụng)`);
    const keywords = [...new Set([...g.keywords, ...it.keywords])];
    if (it.keywords.length) source.push(`Từ khóa từ mô tả: ${it.keywords.join(", ")}`);
    const forSupport = g.forSupport || it.forSupport;
    if (forSupport) source.push("Ưu tiên HS cần hỗ trợ");
    return {
      name: g.name, keywords, forSupport, maxSize: g.maxSize,
      scoreMin: explicitRange ? g.scoreMin : r?.min ?? null,
      scoreMax: explicitRange ? g.scoreMax : r?.max ?? null,
      level: it.level, source,
    };
  });
}
