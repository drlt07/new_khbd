import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getLesson } from "@/server/services/lesson.service";
import { LessonEditor } from "@/components/lessons/lesson-editor";

export const metadata: Metadata = { title: "Kế hoạch bài dạy" };

export default async function LessonPage({ params }: { params: Promise<{ id: string; lid: string }> }) {
  const session = await requireUser();
  const { id, lid } = await params;
  const l = await getLesson(session.userId, lid).catch(() => null);
  if (!l || l.grouping.classId !== id) notFound();
  return (
    <LessonEditor
      key={l.updatedAt.toISOString()}
      id={l.id}
      classId={id}
      groupingTitle={l.grouping.title}
      groups={l.grouping.groups.map((g) => ({
        id: g.id, name: g.name, profile: g.profile, keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport,
        members: g.members.map((m) => m.student.fullName),
      }))}
      initial={{
        subject: l.subject, title: l.title, periods: l.periods, requirements: l.requirements, knowledgeGoals: l.knowledgeGoals,
        competencyGoals: l.competencyGoals, qualityGoals: l.qualityGoals, materials: l.materials, assessment: l.assessment, status: l.status,
        activities: l.activities.map((a) => ({
          phase: a.phase, title: a.title, minutes: a.minutes, goal: a.goal, content: a.content, product: a.product, organization: a.organization,
          byGroup: a.byGroup, tasks: a.tasks.map((t) => ({ groupId: t.groupId, task: t.task, product: t.product, support: t.support })),
        })),
      }}
    />
  );
}
