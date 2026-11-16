import type { Metadata } from "next";
import { BookOpenCheck, ClipboardCheck, Hourglass, Library, Users } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { getDashboardStats } from "@/server/services/dashboard.service";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentLessonPlans } from "@/components/dashboard/recent-lesson-plans";
import { ClassProgress } from "@/components/dashboard/class-progress";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Bảng điều khiển" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireTeacher();
  const { error } = await searchParams;
  const stats = await getDashboardStats(session.teacherId);

  return (
    <>
      <PageHeader title={`Xin chào, ${session.name}`} description="Tổng quan lớp học, hồ sơ học sinh và kế hoạch bài dạy của thầy cô." />

      {error === "forbidden" && <Alert tone="danger" className="mb-4">Bạn không có quyền truy cập trang đó.</Alert>}
      {stats.hasSampleData && (
        <Alert tone="warning" className="mb-4">
          Một số lớp đang chứa <b>dữ liệu mẫu</b> (được gắn nhãn) để kiểm thử hệ thống. Dữ liệu mẫu không phải thông tin học sinh thật.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Lớp học" value={stats.classCount} icon={Library} />
        <StatCard label="Học sinh" value={stats.studentCount} icon={Users} accent="info" />
        <StatCard label="Hồ sơ đã hoàn thiện" value={stats.confirmedProfiles} icon={ClipboardCheck} accent="success" hint="Đã được giáo viên xác nhận" />
        <StatCard
          label="Hồ sơ chờ xác nhận"
          value={stats.pendingProfiles}
          icon={Hourglass}
          accent="warning"
          hint={`${stats.pendingRecommendations} nhận định AI chờ duyệt`}
        />
        <StatCard label="Kế hoạch bài dạy" value={stats.lessonPlanCount} icon={BookOpenCheck} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <ClassProgress classes={stats.classProgress} />
          <RecentLessonPlans plans={stats.recentLessonPlans} />
        </div>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle>Tiến độ cập nhật dữ liệu</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold tabular-nums">{stats.overallProgress}%</span>
                <span className="text-sm text-muted-foreground">{stats.confirmedProfiles}/{stats.studentCount} hồ sơ</span>
              </div>
              <Progress value={stats.overallProgress} label="Tiến độ hồ sơ toàn bộ" />
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {stats.pendingProfiles} hồ sơ chờ xác nhận</li>
                <li>• {stats.needsDataProfiles} hồ sơ cần bổ sung dữ liệu</li>
              </ul>
            </CardContent>
          </Card>
          <QuickActions />
        </div>
      </div>
    </>
  );
}
