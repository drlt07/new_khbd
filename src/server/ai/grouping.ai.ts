import "server-only";
import { z } from "zod/v4";
import { assignToGroups, type Assignment, type MStudent } from "@/lib/grouping/match";
import type { EffectiveCriteria } from "@/lib/grouping/interpret";
import { structured } from "./claude";
import { claudeEngineId, getEngine, RULES_ENGINE } from "./engine";

const Out = z.object({
  assignments: z.array(z.object({ code: z.string(), groupIndex: z.number().int(), reason: z.string(), fit: z.enum(["good", "partial", "none"]) })),
  notes: z.array(z.string()),
});

/**
 * Phân bổ học sinh vào các nhóm GV đã định nghĩa. Claude (nếu có) đọc mô tả nhóm bằng lời + tiêu chí;
 * kết quả được kiểm tra chặt (đủ học sinh, mỗi em một nhóm, đúng sĩ số tối đa) — sai thì dùng bộ máy quy tắc.
 */
export async function analyzeAssignment(args: {
  students: MStudent[];
  groups: (EffectiveCriteria & { description: string | null })[];
  balanceSizes: boolean;
}): Promise<{ assignment: Assignment[]; engine: string; notes: string[] }> {
  const rules = () => assignToGroups(args.students, args.groups, args.balanceSizes);
  if (getEngine().kind !== "claude") return { assignment: rules(), engine: RULES_ENGINE, notes: [] };

  const codes = args.students.map((s, i) => ({ code: `HS${String(i + 1).padStart(2, "0")}`, s }));
  try {
    const out = await structured(Out,
      `Phân bổ mỗi học sinh vào đúng MỘT nhóm trong danh sách nhóm do giáo viên định nghĩa (số nhóm cố định).
Dùng đồng thời: mô tả nhóm bằng lời của giáo viên, tiêu chí (từ khóa đặc trưng, khoảng điểm, ưu tiên hỗ trợ, sĩ số tối đa), điểm trung bình và đặc trưng của học sinh.
${args.balanceSizes ? "Giữ sĩ số các nhóm chênh nhau tối đa 1." : "KHÔNG bắt buộc sĩ số bằng nhau; chỉ tôn trọng sĩ số tối đa nếu có."}
Với mỗi học sinh, viết lý do ngắn (≤ 25 từ) dựa trên dữ liệu thật; fit = good/partial/none. notes: tối đa 3 lưu ý cho giáo viên.`,
      {
        groups: args.groups.map((g, i) => ({ index: i, name: g.name, description: g.description, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, maxSize: g.maxSize ?? null })),
        students: codes.map(({ code, s }) => ({ code, score: s.score == null ? null : Math.round(s.score * 10) / 10, interests: s.interests, strengths: s.strengths, needs: s.needs })),
      });
    const byCode = new Map(codes.map((c) => [c.code, c.s.id]));
    const seen = new Set<string>();
    const sizes = args.groups.map(() => 0);
    const assignment: Assignment[] = [];
    for (const a of out.assignments) {
      const id = byCode.get(a.code);
      if (!id || seen.has(id) || a.groupIndex < 0 || a.groupIndex >= args.groups.length) throw new Error("invalid");
      seen.add(id);
      sizes[a.groupIndex]++;
      assignment.push({ studentId: id, groupIndex: a.groupIndex, reason: a.reason, fit: a.fit });
    }
    if (seen.size !== args.students.length) throw new Error("missing");
    if (args.groups.some((g, i) => g.maxSize && sizes[i] > g.maxSize)) throw new Error("maxSize");
    return { assignment, engine: claudeEngineId(), notes: out.notes };
  } catch (e) {
    const why = e instanceof Error && e.name === "AIError" ? e.message : "kết quả AI không hợp lệ";
    return { assignment: rules(), engine: `${RULES_ENGINE}+fallback`, notes: [`Claude chưa dùng được (${why}) — đã dùng bộ máy quy tắc.`] };
  }
}
