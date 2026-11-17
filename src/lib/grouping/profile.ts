/**
 * Hồ sơ nhóm học tập (Learning Group Profile) — tổng hợp từ thành viên thật của nhóm (bộ máy quy tắc).
 */
import { LEVEL_LABEL, type Level } from "./interpret";
import type { MStudent } from "./match";

export type ProfileSummary = {
  competency: string;
  strengths: string[];
  difficulties: string[];
  needs: string;
  supportGoal: string;
  avgScore: number | null;
};

const f1 = (x: number) => (Math.round(x * 10) / 10).toString().replace(".", ",");

function top(labels: string[], n: number) {
  const c = new Map<string, number>();
  labels.forEach((l) => c.set(l, (c.get(l) ?? 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi")).slice(0, n).map(([l, k]) => (k > 1 ? `${l} (${k})` : l));
}

export function summarizeGroup(g: { name: string; description: string | null; level: Level | null; forSupport: boolean }, members: MStudent[]): ProfileSummary {
  const scores = members.map((m) => m.score).filter((x): x is number => x != null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const strengths = top(members.flatMap((m) => m.strengths), 5);
  const difficulties = top(members.flatMap((m) => m.needs), 5);
  const needCount = members.filter((m) => m.needs.length).length;

  const parts: string[] = [];
  if (g.description) parts.push(g.description.replace(/\.$/, ""));
  if (avg != null) parts.push(`điểm TB ${f1(avg)} (${f1(Math.min(...scores))}–${f1(Math.max(...scores))})`);
  else if (g.level != null) parts.push(LEVEL_LABEL[g.level]);
  const competency = parts.join("; ") || "Chưa đủ dữ liệu để mô tả năng lực nhóm";

  const support = g.forSupport || g.level === 0 || (avg != null && avg < 5.5);
  const advanced = g.level === 3 || (avg != null && avg >= 8);
  const needs = support
    ? `Cần hướng dẫn từng bước, học liệu gợi ý và thêm thời gian${needCount ? `; ${needCount}/${members.length} em có nhu cầu hỗ trợ cụ thể` : ""}.`
    : advanced
      ? "Cần nhiệm vụ mở, có thử thách, cơ hội tự học và phản biện."
      : `Cần luyện tập vận dụng có định hướng${needCount ? `; lưu ý ${needCount} em có nhu cầu hỗ trợ` : ""}.`;
  const supportGoal = support
    ? "Đạt được yêu cầu cần đạt cơ bản của bài; củng cố kiến thức nền, tăng tự tin tham gia."
    : advanced
      ? "Vượt yêu cầu cần đạt: vận dụng sáng tạo, hỗ trợ bạn, dẫn dắt thảo luận."
      : "Đạt vững yêu cầu cần đạt và vận dụng được vào tình huống quen thuộc.";
  return { competency, strengths, difficulties, needs, supportGoal, avgScore: avg };
}
