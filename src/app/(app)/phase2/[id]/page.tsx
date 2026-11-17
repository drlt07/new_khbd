import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getLesson } from "@/server/services/lesson.service";
import { getEngine } from "@/server/ai/engine";
import { LessonWorkspace } from "@/components/phase2/editor/lesson-workspace";

export const metadata: Metadata = { title: "Trình soạn KHBD" };

export default async function LessonEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const { id } = await params;
  const l = await getLesson(user.userId, id).catch(() => null);
  if (!l) notFound();
  const e = getEngine();
  const q = await searchParams;
  const notice = q.n === "generated"
    ? q.note ?? `Đã tạo tiến trình chung và nhiệm vụ phân hóa bằng ${q.e?.startsWith("claude") ? "Claude AI" : "bộ máy quy tắc"}. Thầy cô rà soát và chỉnh sửa từng khối.`
    : q.n === "upgraded" ? `Đã cập nhật theo hồ sơ nhóm v${q.v}: giữ ${q.m} nhiệm vụ, thêm ${q.a} nhiệm vụ gợi ý cho nhóm mới, bỏ ${q.r} nhiệm vụ của nhóm không còn.` : null;
  return (
    <LessonWorkspace
      key={l.updatedAt.toISOString()}
      initialNotice={notice}
      id={l.id}
      className={l.session.class.name}
      engine={{ kind: e.kind, label: e.label }}
      session={{ id: l.session.id, title: l.session.title, version: l.session.version, status: l.session.status }}
      latest={l.latest}
      groups={l.session.groups.map((g) => ({
        id: g.id, name: g.name, profile: g.description, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, avgScore: g.avgScore,
        competency: g.competency, strengths: g.strengths, difficulties: g.difficulties, needs: g.needs, supportGoal: g.supportGoal, members: g.members.map((m) => m.student.fullName),
      }))}
      initial={{
        subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements, content: l.content, methods: l.methods,
        knowledgeGoals: l.knowledgeGoals, competencyGoals: l.competencyGoals, qualityGoals: l.qualityGoals, materials: l.materials, assessment: l.assessment, status: l.status,
        activities: l.activities.map((a) => ({
          key: a.id, phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization, byGroup: a.byGroup,
          tasks: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support, materials: t.materials, challenge: t.challenge, assessment: t.assessment })),
        })),
      }}
    />
  );
}
