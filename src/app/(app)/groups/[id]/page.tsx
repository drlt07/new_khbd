import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getGrouping } from "@/server/services/grouping.service";
import { GroupingEditor } from "@/components/groups/grouping-editor";

export const metadata: Metadata = { title: "Kết quả chia nhóm" };

export default async function GroupingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const data = await getGrouping(session.userId, id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const { grouping, classStudents } = data;
  return (
    <>
      <Link href="/groups" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"><ChevronLeft className="size-4" /> Chia nhóm</Link>
      <GroupingEditor
        key={grouping.updatedAt.toISOString()}
        id={grouping.id}
        initialTitle={grouping.title}
        method={grouping.method}
        className={grouping.class.name}
        students={classStudents}
        initialGroups={grouping.groups.map((g) => ({ name: g.name, task: g.task, members: g.members }))}
      />
    </>
  );
}
