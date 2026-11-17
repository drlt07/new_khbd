import type { Phase } from "@/lib/lesson/template";

export type ETask = { groupId: string; task: string; product: string | null; support: string | null; materials: string | null; challenge: string | null; assessment: string | null };
export type EActivity = { key: string; phase: Phase; title: string; minutes: number | null; goal: string | null; content: string | null; product: string | null; organization: string | null; byGroup: boolean; tasks: ETask[] };
export type ELesson = {
  subject: string; title: string; periods: number; requirements: string | null; content: string | null; methods: string | null;
  knowledgeGoals: string | null; competencyGoals: string | null; qualityGoals: string | null; materials: string | null; assessment: string | null;
  status: "DRAFT" | "REVIEW" | "DONE"; activities: EActivity[];
};
export type EGroup = {
  id: string; name: string; profile: string | null; keywords: string[]; scoreMin: number | null; scoreMax: number | null; forSupport: boolean;
  avgScore: number | null; competency: string | null; strengths: string[]; difficulties: string[]; needs: string | null; supportGoal: string | null; members: string[];
};
export type Selection = { kind: "section"; key: "objectives" | "materials" | "assessment" | "matrix" } | { kind: "activity"; key: string } | { kind: "task"; key: string; groupId: string } | null;

export const GROUP_COLORS = [
  { dot: "bg-indigo-500", soft: "bg-indigo-50", border: "border-l-indigo-400", text: "text-indigo-700" },
  { dot: "bg-emerald-500", soft: "bg-emerald-50", border: "border-l-emerald-400", text: "text-emerald-700" },
  { dot: "bg-amber-500", soft: "bg-amber-50", border: "border-l-amber-400", text: "text-amber-700" },
  { dot: "bg-rose-500", soft: "bg-rose-50", border: "border-l-rose-400", text: "text-rose-700" },
  { dot: "bg-sky-500", soft: "bg-sky-50", border: "border-l-sky-400", text: "text-sky-700" },
  { dot: "bg-violet-500", soft: "bg-violet-50", border: "border-l-violet-400", text: "text-violet-700" },
];
export const colorOf = (i: number) => GROUP_COLORS[i % GROUP_COLORS.length];
