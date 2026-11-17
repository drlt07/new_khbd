import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listLessons } from "@/server/services/lesson.service";
import { LessonList } from "@/components/lessons/lesson-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Soạn KHBD" };

export default async function ClassLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const [items, groupings] = await Promise.all([listLessons(session.userId, id), prisma.grouping.count({ where: { classId: id } })]);
  if (!groupings)
    return <EmptyState icon={BookOpenCheck} title="Cần hoàn thành Pha 1 trước" description="KHBD được soạn từ một bộ nhóm: mỗi hoạt động giao nhiệm vụ riêng cho từng nhóm. Hãy tạo bộ nhóm trước." action={<Button asChild><Link href={`/classes/${id}/groups/new`}>Tạo bộ nhóm</Link></Button>} />;
  const newBtn = <Button asChild><Link href={`/classes/${id}/lessons/new`}><Plus /> Soạn KHBD mới</Link></Button>;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Pha 2. Mỗi KHBD dùng một bộ nhóm từ Pha 1; nhiệm vụ trong từng hoạt động được giao riêng theo đặc trưng nhóm.</p>
        {items.length > 0 && newBtn}
      </div>
      {items.length ? <LessonList items={items} /> : <EmptyState icon={BookOpenCheck} title="Chưa có KHBD" description="Chọn bộ nhóm, nhập tên bài và yêu cầu cần đạt — hệ thống dựng khung KHBD với nhiệm vụ cho từng nhóm." action={newBtn} />}
    </div>
  );
}
