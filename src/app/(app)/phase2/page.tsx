import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listLessons } from "@/server/services/lesson.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LessonStatus, timeAgo } from "@/components/common/status";

export const metadata: Metadata = { title: "Thiết kế KHBD" };

export default async function Phase2Page() {
  const user = await requireUser();
  const all = await listLessons(user.userId);
  const doing = all.filter((l) => l.status !== "DONE" || l.outdated);
  const newBtn = <Button asChild><Link href="/phase2/new"><Plus /> KHBD mới</Link></Button>;
  return (
    <PageContainer>
      <PageHeader eyebrow={<span className="text-xs font-semibold uppercase tracking-wide text-success">02 · Pha 2</span>} title="Thiết kế KHBD"
        description="Bài học → Tiến trình chung → Nhiệm vụ phân hóa theo nhóm → Đánh giá. KHBD đã hoàn thành nằm trong Kho KHBD." actions={newBtn} />
      {doing.length ? (
        <Card className="divide-y">
          {doing.map((l) => (
            <Link key={l.id} href={`/phase2/${l.id}`} className="flex flex-col gap-2 p-4 hover:bg-muted/40 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{l.title}</p>
                <p className="text-xs text-muted-foreground">Lớp {l.session.class.name} · {l.subject} · {l.periods} tiết · hồ sơ nhóm “{l.session.title}” v{l.session.version} ({l.session._count.groups} nhóm)</p>
              </div>
              <LessonStatus status={l.status} outdated={l.outdated} />
              <span className="text-xs text-muted-foreground">{l._count.activities ? `${l._count.activities} hoạt động` : "Chưa có tiến trình"} · {timeAgo(l.updatedAt)}</span>
            </Link>
          ))}
        </Card>
      ) : <EmptyState icon={BookOpenCheck} title="Không có KHBD đang thiết kế" description="Tạo KHBD mới từ một hồ sơ nhóm đã duyệt." action={newBtn} />}
    </PageContainer>
  );
}
