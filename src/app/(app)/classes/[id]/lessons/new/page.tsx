import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NewLessonForm } from "@/components/lessons/new-lesson-form";

export const metadata: Metadata = { title: "Soạn KHBD mới" };

export default async function NewLessonPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ groupingId?: string }> }) {
  await requireUser();
  const { id } = await params;
  const { groupingId } = await searchParams;
  const groupings = await prisma.grouping.findMany({
    where: { classId: id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, subject: true, groups: { orderBy: { sortOrder: "asc" }, select: { name: true, _count: { select: { members: true } } } } },
  });
  if (!groupings.length) redirect(`/classes/${id}/lessons`);
  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-1 text-lg font-semibold">Soạn KHBD mới</h2>
      <p className="mb-4 text-sm text-muted-foreground">Bước 1/2: thông tin bài học. Bước 2: chỉnh khung KHBD và nhiệm vụ từng nhóm.</p>
      <NewLessonForm classId={id} defaultGroupingId={groupingId}
        groupings={groupings.map((g) => ({ id: g.id, title: g.title, subject: g.subject, groups: g.groups.map((x) => ({ name: x.name, count: x._count.members })) }))} />
    </div>
  );
}
