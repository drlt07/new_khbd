import "server-only";
import { z } from "zod/v4";
import { adjustTaskRules, buildLessonDraft, createMaterialRules, suggestTask, PHASE_LABEL, type DraftActivity, type DraftTask, type Phase, type TemplateGroup, type TemplateLesson } from "@/lib/lesson/template";
import { structured } from "./claude";
import { claudeEngineId, getEngine, RULES_ENGINE } from "./engine";

export type LessonInfo = TemplateLesson & { content: string | null; methods: string | null };
export type ProfileForAI = TemplateGroup & { strengths: string[]; difficulties: string[]; needs: string | null; supportGoal: string | null; size: number };

const TaskOut = z.object({ groupIndex: z.number().int(), task: z.string(), product: z.string(), materials: z.string(), challenge: z.string(), support: z.string(), assessment: z.string() });
const LessonOut = z.object({
  knowledgeGoals: z.string(), competencyGoals: z.string(), qualityGoals: z.string(), materials: z.string(), assessment: z.string(),
  activities: z.array(z.object({
    phase: z.enum(["OPENING", "KNOWLEDGE", "PRACTICE", "APPLICATION"]), title: z.string(), minutes: z.number().int(),
    goal: z.string(), content: z.string(), product: z.string(), organization: z.string(), byGroup: z.boolean(), tasks: z.array(TaskOut),
  })),
});

const groupBrief = (groups: ProfileForAI[]) => groups.map((g, i) => ({
  index: i, name: g.name, teacherDescription: g.profile, competency: g.competency ?? null, avgScore: g.avgScore == null ? null : Math.round(g.avgScore * 10) / 10,
  strengths: g.strengths, difficulties: g.difficulties, needs: g.needs, supportGoal: g.supportGoal, size: g.size,
}));

export type GeneratedLesson = { goals: { knowledgeGoals: string | null; competencyGoals: string | null; qualityGoals: string | null; materials: string | null; assessment: string | null }; activities: DraftActivity[]; engine: string; note?: string };

/** Pha 2 — Tạo tiến trình chung + nhiệm vụ phân hóa cho từng nhóm (một KHBD thống nhất) */
export async function generateLesson(lesson: LessonInfo, groups: ProfileForAI[]): Promise<GeneratedLesson> {
  const rules = (note?: string): GeneratedLesson => ({ goals: { knowledgeGoals: null, competencyGoals: null, qualityGoals: null, materials: null, assessment: null }, activities: buildLessonDraft(lesson, groups), engine: note ? `${RULES_ENGINE}+fallback` : RULES_ENGINE, note });
  if (getEngine().kind !== "claude") return rules();
  try {
    const out = await structured(LessonOut,
      `Soạn MỘT kế hoạch bài dạy thống nhất (CV 5512) cho cả lớp, có phân hóa nhiệm vụ theo các nhóm học tập đã được giáo viên duyệt.
- Đúng 4 hoạt động theo thứ tự OPENING, KNOWLEDGE, PRACTICE, APPLICATION; tổng số phút = ${lesson.periods * 45}.
- organization: 4 bước (Chuyển giao – Thực hiện – Báo cáo, thảo luận – Kết luận, nhận định), mỗi bước một dòng.
- Hoạt động có byGroup = true phải có đúng một task cho MỖI nhóm (groupIndex). Nhiệm vụ khác nhau về cách tiếp cận, mức thử thách, học liệu và mức hỗ trợ, dựa trên hồ sơ nhóm; cùng hướng tới yêu cầu cần đạt.
- assessment của task: tiêu chí đánh giá theo nhóm.`,
      { lesson, groups: groupBrief(groups) }, "high");
    const n = groups.length;
    if (out.activities.length < 3 || out.activities.some((a) => a.byGroup && (a.tasks.length !== n || new Set(a.tasks.map((t) => t.groupIndex)).size !== n || a.tasks.some((t) => t.groupIndex < 0 || t.groupIndex >= n))))
      return rules("Kết quả AI thiếu nhiệm vụ cho một số nhóm — đã dùng bộ máy quy tắc.");
    return {
      goals: { knowledgeGoals: out.knowledgeGoals, competencyGoals: out.competencyGoals, qualityGoals: out.qualityGoals, materials: out.materials, assessment: out.assessment },
      activities: out.activities.map((a) => ({ ...a, tasks: a.byGroup ? a.tasks.map((t) => ({ ...t, groupId: groups[t.groupIndex].id })) : [] })),
      engine: claudeEngineId(),
    };
  } catch (e) {
    return rules(`Claude chưa dùng được (${e instanceof Error ? e.message : "lỗi"}) — đã dùng bộ máy quy tắc.`);
  }
}

/** Trợ lý: gợi ý lại nhiệm vụ của một hoạt động cho các nhóm được chọn */
export async function suggestActivityTasks(lesson: LessonInfo, phase: Phase, activityTitle: string, groups: ProfileForAI[]): Promise<{ tasks: DraftTask[]; engine: string; note?: string }> {
  const rules = (note?: string) => ({ tasks: phase === "OPENING" ? [] : groups.map((g) => suggestTask(phase, lesson, g)), engine: note ? `${RULES_ENGINE}+fallback` : RULES_ENGINE, note });
  if (getEngine().kind !== "claude") return rules();
  try {
    const out = await structured(z.object({ tasks: z.array(TaskOut) }),
      `Đề xuất nhiệm vụ phân hóa cho hoạt động "${activityTitle}" (${PHASE_LABEL[phase]}), mỗi nhóm đúng một nhiệm vụ (groupIndex), dựa trên hồ sơ nhóm.`,
      { lesson, groups: groupBrief(groups) });
    if (out.tasks.length !== groups.length) return rules("Kết quả AI không đủ nhóm — đã dùng quy tắc.");
    return { tasks: out.tasks.filter((t) => groups[t.groupIndex]).map((t) => ({ ...t, groupId: groups[t.groupIndex].id })), engine: claudeEngineId() };
  } catch (e) {
    return rules(`Claude chưa dùng được (${e instanceof Error ? e.message : "lỗi"}) — đã dùng quy tắc.`);
  }
}

/** Trợ lý: điều chỉnh độ khó của một nhiệm vụ nhóm */
export async function adjustTask(lesson: LessonInfo, group: ProfileForAI, task: DraftTask, direction: "easier" | "harder") {
  if (getEngine().kind !== "claude") return { task: adjustTaskRules(task, direction), engine: RULES_ENGINE };
  try {
    const out = await structured(TaskOut.omit({ groupIndex: true }),
      `Điều chỉnh nhiệm vụ của nhóm "${group.name}" cho ${direction === "easier" ? "DỄ HƠN (thêm khung hỗ trợ, chia nhỏ bước, vẫn giữ yêu cầu cần đạt)" : "KHÓ HƠN (mở rộng, sáng tạo, phản biện)"}.`,
      { lesson, group: groupBrief([group])[0], currentTask: task }, "low");
    return { task: { ...out, groupId: task.groupId }, engine: claudeEngineId() };
  } catch {
    return { task: adjustTaskRules(task, direction), engine: `${RULES_ENGINE}+fallback` };
  }
}

/** Trợ lý: tạo học liệu (phiếu học tập) cho nhiệm vụ của một nhóm */
export async function createMaterial(lesson: LessonInfo, group: ProfileForAI, task: DraftTask) {
  if (getEngine().kind !== "claude") return { material: createMaterialRules(lesson, group, task), engine: RULES_ENGINE };
  try {
    const out = await structured(z.object({ material: z.string() }),
      `Soạn phiếu học tập (văn bản thuần, có tiêu đề, 3–5 câu hỏi/nhiệm vụ phân bậc, tiêu chí tự đánh giá) cho nhóm "${group.name}" theo nhiệm vụ đã cho, phù hợp hồ sơ nhóm.`,
      { lesson, group: groupBrief([group])[0], task }, "low");
    return { material: out.material, engine: claudeEngineId() };
  } catch {
    return { material: createMaterialRules(lesson, group, task), engine: `${RULES_ENGINE}+fallback` };
  }
}
