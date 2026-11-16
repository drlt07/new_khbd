import Link from "next/link";
import { Library } from "lucide-react";
import type { DashboardStats } from "@/server/services/dashboard.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export function ClassProgress({ classes }: { classes: DashboardStats["classProgress"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến độ cập nhật hồ sơ theo lớp</CardTitle>
        <CardDescription>Tỷ lệ học sinh có hồ sơ đã được giáo viên xác nhận.</CardDescription>
      </CardHeader>
      <CardContent>
        {classes.length === 0 ? (
          <EmptyState
            icon={Library}
            title="Chưa có lớp học"
            description="Tạo lớp học và thêm học sinh để bắt đầu xây dựng hồ sơ."
            action={<Button asChild size="sm"><Link href="/classes">Tạo lớp học</Link></Button>}
          />
        ) : (
          <ul className="space-y-4">
            {classes.map((c) => (
              <li key={c.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">Lớp {c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.schoolYear}</span>
                  {c.isSample && <SampleBadge />}
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {c.confirmed}/{c.studentCount} hồ sơ · {c.progress}%
                  </span>
                </div>
                <Progress value={c.progress} label={`Tiến độ lớp ${c.name}`} />
                <p className="text-xs text-muted-foreground">
                  {c.pending} chờ xác nhận · {c.notAnalyzed} chưa phân tích · {c.evidenceCount} minh chứng
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
