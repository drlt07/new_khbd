import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listLessons } from "@/server/services/lesson.service";
import { PageHeader } from "@/components/layout/page-header";
import { LessonList } from "@/components/lessons/lesson-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Kế hoạch bài dạy" };

export default async function AllLessonsPage() {
  const session = await requireUser();
  const items = await listLessons(session.userId);
  return (
    <>
      <PageHeader title="Kế hoạch bài dạy" description="Tất cả KHBD của thầy cô ở mọi lớp. Để soạn KHBD mới, vào lớp → tab Soạn KHBD." />
      {items.length ? <LessonList items={items} showClass /> : <EmptyState icon={BookOpenCheck} title="Chưa có KHBD" description="Soạn KHBD trong từng lớp sau khi đã chia nhóm (Pha 1)." action={<Button asChild><Link href="/classes">Chọn lớp</Link></Button>} />}
    </>
  );
}
