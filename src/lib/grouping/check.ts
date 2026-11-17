/**
 * Kiểm tra mức độ phù hợp của kết quả phân nhóm (chạy lại mỗi khi GV chuyển học sinh).
 */
import { fitScore, type GroupSpec, type MStudent } from "./match";

export type CheckIssue = { level: "error" | "warning" | "info"; message: string; groupIndex?: number; studentId?: string };

export function checkGrouping(groups: (GroupSpec & { members: string[] })[], students: MStudent[], allStudentIds: string[]): {
  issues: CheckIssue[]; fitRate: number; misplaced: { studentId: string; from: number; better: number }[];
} {
  const byId = new Map(students.map((s) => [s.id, s]));
  const issues: CheckIssue[] = [];
  const assigned = new Set(groups.flatMap((g) => g.members));
  const unassigned = allStudentIds.filter((id) => !assigned.has(id));
  if (unassigned.length) issues.push({ level: "warning", message: `${unassigned.length} học sinh chưa được xếp nhóm` });

  let fitting = 0, total = 0;
  const misplaced: { studentId: string; from: number; better: number }[] = [];
  groups.forEach((g, gi) => {
    if (!g.members.length) issues.push({ level: "error", groupIndex: gi, message: `${g.name} chưa có thành viên` });
    else if (g.members.length === 1) issues.push({ level: "warning", groupIndex: gi, message: `${g.name} chỉ có 1 học sinh — cân nhắc gộp nhóm` });
    if (g.maxSize && g.members.length > g.maxSize) issues.push({ level: "warning", groupIndex: gi, message: `${g.name} vượt sĩ số tối đa (${g.members.length}/${g.maxSize})` });
    for (const sid of g.members) {
      const s = byId.get(sid);
      if (!s) continue;
      total++;
      const fits = groups.map((x) => fitScore(s, x).value);
      if (fits[gi] > 0) fitting++;
      const best = fits.reduce((b, v, i) => (v > fits[b] ? i : b), 0);
      if (best !== gi && fits[best] - fits[gi] >= 3) misplaced.push({ studentId: sid, from: gi, better: best });
    }
  });
  const noData = students.filter((s) => assigned.has(s.id) && !s.strengths.length && !s.interests.length && !s.needs.length && s.score == null).length;
  if (noData) issues.push({ level: "info", message: `${noData} học sinh chưa có đặc trưng và điểm — xếp để cân bằng, nên bổ sung dữ liệu` });
  if (misplaced.length) issues.push({ level: "info", message: `${misplaced.length} học sinh phù hợp rõ rệt hơn với nhóm khác (do giới hạn sĩ số hoặc GV chỉnh tay)` });
  return { issues, fitRate: total ? Math.round((fitting / total) * 100) : 0, misplaced };
}
