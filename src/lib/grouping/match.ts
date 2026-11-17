/**
 * PHA 1 — Xếp học sinh vào các nhóm do giáo viên định nghĩa (thuần, không I/O, có kiểm thử).
 *
 * Giáo viên quyết định SỐ NHÓM và ĐẶC TRƯNG từng nhóm:
 *   - keywords: thế mạnh / sở thích phù hợp với nhóm
 *   - scoreMin/scoreMax: khoảng điểm phù hợp (tùy chọn, dùng bảng điểm đã tải lên)
 *   - forSupport: nhóm ưu tiên học sinh cần hỗ trợ
 * Hệ thống tính mức phù hợp của từng học sinh với từng nhóm và xếp vào nhóm phù hợp nhất,
 * kèm lý do cụ thể. Không đủ dữ liệu thì ghi rõ, không suy đoán.
 */

export type MStudent = {
  id: string;
  fullName: string;
  interests: string[];
  strengths: string[];
  needs: string[];
  score: number | null; // điểm trung bình môn (theo hệ số) — null nếu chưa có
};

export type GroupSpec = {
  name: string;
  keywords: string[];
  scoreMin: number | null;
  scoreMax: number | null;
  forSupport: boolean;
};

export type Assignment = { studentId: string; groupIndex: number; reason: string; fit: "good" | "partial" | "none" };

const W = { strength: 3, interest: 2, need: 2, scoreIn: 3, scoreOutPerPoint: 1.5, support: 2.5, notSupport: 1 };

export const normText = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\s+/g, " ").trim();

/** "Văn" khớp "Văn học"; "Thuyết trình" khớp "thuyết trình" — so khớp theo cụm từ không dấu */
export function keywordMatches(keyword: string, label: string) {
  const k = normText(keyword), l = normText(label);
  if (!k || !l) return false;
  const words = (x: string) => ` ${x} `;
  return words(l).includes(words(k)) || words(k).includes(words(l));
}

const fmt = (x: number) => (Math.round(x * 10) / 10).toString().replace(".", ",");

export function describeRange(g: Pick<GroupSpec, "scoreMin" | "scoreMax">) {
  if (g.scoreMin != null && g.scoreMax != null) return `${fmt(g.scoreMin)}–${fmt(g.scoreMax)}`;
  if (g.scoreMin != null) return `từ ${fmt(g.scoreMin)}`;
  if (g.scoreMax != null) return `dưới ${fmt(g.scoreMax)}`;
  return null;
}

type Fit = { value: number; reasons: string[]; evidence: number };

/** Mức phù hợp của một học sinh với một nhóm + lý do */
export function fitScore(s: MStudent, g: GroupSpec): Fit {
  let value = 0, evidence = 0;
  const reasons: string[] = [];
  const hit = (labels: string[]) => labels.filter((l) => g.keywords.some((k) => keywordMatches(k, l)));

  const st = hit(s.strengths), it = hit(s.interests);
  if (st.length) { value += W.strength * st.length; evidence++; reasons.push(`thế mạnh ${st.join(", ")}`); }
  if (it.length) { value += W.interest * it.length; evidence++; reasons.push(`sở thích ${it.join(", ")}`); }

  if (g.forSupport) {
    const nd = s.needs.length ? s.needs : hit(s.needs);
    if (nd.length) { value += W.support; evidence++; reasons.push(`cần hỗ trợ: ${nd.slice(0, 2).join(", ")}`); }
    else value -= W.notSupport;
  } else {
    const nd = hit(s.needs);
    if (nd.length) { value += W.need; evidence++; reasons.push(`cần rèn: ${nd.join(", ")}`); }
  }

  const hasRange = g.scoreMin != null || g.scoreMax != null;
  if (hasRange && s.score != null) {
    const below = g.scoreMin != null && s.score < g.scoreMin ? g.scoreMin - s.score : 0;
    // scoreMax là cận trên KHÔNG bao gồm (dưới 6,5 nghĩa là < 6,5)
    const above = g.scoreMax != null && s.score >= g.scoreMax ? s.score - g.scoreMax + 0.01 : 0;
    const dist = below + above;
    if (dist === 0) { value += W.scoreIn; evidence++; reasons.push(`điểm ${fmt(s.score)} trong khoảng ${describeRange(g)}`); }
    else value -= Math.min(dist, 4) * W.scoreOutPerPoint;
  }
  return { value, reasons, evidence };
}

function capacities(n: number, k: number) {
  const base = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0));
}

/**
 * Xếp học sinh. balanceSizes = true: sĩ số các nhóm chênh nhau tối đa 1 (nhóm phù hợp nhất còn chỗ).
 * balanceSizes = false: mỗi học sinh vào nhóm phù hợp nhất, sĩ số theo thực tế.
 */
export function assignToGroups(students: MStudent[], groups: GroupSpec[], balanceSizes = true): Assignment[] {
  const k = groups.length;
  if (!k) return [];
  const fits = students.map((s) => groups.map((g) => fitScore(s, g)));

  // Thứ tự xếp: học sinh có lựa chọn rõ ràng nhất (chênh lệch giữa nhóm tốt nhất và nhì lớn) xếp trước,
  // để không bị nhóm khác "chiếm chỗ"; học sinh không có dữ liệu xếp sau cùng.
  const order = students.map((_, i) => i).sort((a, b) => regret(fits[b]) - regret(fits[a]) || a - b);
  const cap = balanceSizes ? capacities(students.length, k) : Array(k).fill(Infinity);
  // Nhóm nào có sức chứa lớn hơn được dành cho nhóm có nhiều học sinh phù hợp nhất
  if (balanceSizes) {
    const demand = groups.map((_, gi) => fits.filter((f) => bestIndex(f) === gi && f[gi].value > 0).length);
    const slots = [...cap].sort((a, b) => b - a);
    groups.map((_, gi) => gi).sort((a, b) => demand[b] - demand[a] || a - b).forEach((gi, rank) => (cap[gi] = slots[rank]));
  }
  const size = Array(k).fill(0);
  const out: Assignment[] = [];

  for (const i of order) {
    const s = students[i];
    const ranked = fits[i].map((f, gi) => ({ f, gi })).sort((a, b) => b.f.value - a.f.value || size[a.gi] - size[b.gi]);
    const choice = ranked.find((r) => size[r.gi] < cap[r.gi]) ?? ranked[0];
    size[choice.gi]++;
    const best = ranked[0];
    const noData = !s.strengths.length && !s.interests.length && !s.needs.length && s.score == null;
    let reason: string, fit: Assignment["fit"];
    if (noData) {
      reason = "Chưa có đặc trưng và điểm — xếp để cân bằng sĩ số, cần bổ sung dữ liệu";
      fit = "none";
    } else if (choice.f.evidence > 0 && choice.f.value > 0) {
      reason = `Phù hợp: ${choice.f.reasons.join("; ")}`;
      if (choice.gi !== best.gi && best.f.value > choice.f.value)
        reason += ` (phù hợp hơn với ${groups[best.gi].name} nhưng nhóm đã đủ sĩ số)`;
      fit = choice.f.value >= W.scoreIn ? "good" : "partial";
    } else {
      reason = choice.gi !== best.gi && best.f.value > 0
        ? `Phù hợp hơn với ${groups[best.gi].name} nhưng nhóm đã đủ sĩ số — cơ hội thử sức vai trò mới`
        : "Đặc trưng chưa khớp nhóm nào — xếp để cân bằng sĩ số, cơ hội thử sức vai trò mới";
      fit = "none";
    }
    out.push({ studentId: s.id, groupIndex: choice.gi, reason, fit });
  }
  return out;
}

function bestIndex(f: Fit[]) {
  return f.reduce((b, x, i) => (x.value > f[b].value ? i : b), 0);
}
function regret(f: Fit[]) {
  const v = f.map((x) => x.value).sort((a, b) => b - a);
  return (v[0] ?? 0) - (v[1] ?? 0) + (v[0] > 0 ? 0.001 : -100);
}

/** Điểm trung bình theo hệ số của một học sinh trong một bảng điểm */
export function weightedAverage(scores: { value: number; weight: number }[]) {
  const w = scores.reduce((a, s) => a + s.weight, 0);
  return w ? scores.reduce((a, s) => a + s.value * s.weight, 0) / w : null;
}
