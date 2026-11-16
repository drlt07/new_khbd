import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import type { DashboardStats } from "@/server/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { LESSON_STATUS_LABEL, LESSON_STATUS_TONE } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export function RecentLessonPlans({ plans }: { plans: DashboardStats["recentLessonPlans"] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>KHBD gần đây</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link href="/lesson-plans">Xem tất cả</Link></Button>
      </CardHeader>
      <CardContent>
        {plans.length === 0 ? (
          <EmptyState
            icon={BookOpenCheck}
            title="Chưa có kế hoạch bài dạy"
            description="Sau khi hồ sơ học sinh được xác nhận, hãy tạo KHBD có cá thể hóa đầu tiên."
            action={<Button asChild size="sm"><Link href="/lesson-plans/new">Tạo KHBD</Link></Button>}
          />
        ) : (
          <ul className="divide-y">
            {plans.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.subject.name} · Lớp {p.class.name} · Cập nhật {formatDate(p.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {p.isSample && <SampleBadge />}
                  <Badge tone={LESSON_STATUS_TONE[p.status]}>{LESSON_STATUS_LABEL[p.status]}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
