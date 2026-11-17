import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getGrouping } from "@/server/services/grouping.service";
import { classKeywordSuggestions } from "@/server/services/views";
import { GroupingEditor } from "@/components/groups/grouping-editor";

export const metadata: Metadata = { title: "Bộ nhóm" };

export default async function GroupingPage({ params }: { params: Promise<{ id: string; gid: string }> }) {
  const session = await requireUser();
  const { id, gid } = await params;
  const data = await getGrouping(session.userId, gid).catch(() => null);
  if (!data || data.grouping.classId !== id) notFound();
  const { grouping, classStudents } = data;
  const [sheets, keywords] = await Promise.all([
    prisma.scoreSheet.findMany({ where: { classId: id }, orderBy: { createdAt: "desc" }, select: { id: true, subject: true, fileName: true } }),
    classKeywordSuggestions(id),
  ]);
  return (
    <GroupingEditor
      key={grouping.updatedAt.toISOString()}
      id={grouping.id}
      classId={id}
      lessonCount={grouping._count.lessonPlans}
      students={classStudents}
      sheets={sheets}
      keywordSuggestions={keywords}
      initial={{
        title: grouping.title, subject: grouping.subject, scoreSheetId: grouping.scoreSheetId, balanceSizes: grouping.balanceSizes,
        groups: grouping.groups.map((g) => ({
          id: g.id, name: g.name, profile: g.profile ?? "", keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport,
          members: g.members, taskCount: g._count.tasks,
        })),
      }}
    />
  );
}
