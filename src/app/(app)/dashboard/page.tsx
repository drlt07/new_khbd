import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardCheck, History, Library, Plus, Users, BookOpenCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/server/services/dashboard.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniSteps, timeAgo } from "@/components/common/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tổng quan" };

const P1 = ["Dữ liệu", "Tiêu chí", "Phân nhóm", "Duyệt nhóm"];
const P2 = ["Bài học", "Tiến trình & nhiệm vụ", "Hoàn thiện"];

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="size-4.5" /></span>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums">{value}</p>{hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}</div>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await requireUser();
  const d = await getDashboard(session.userId);
  const newBtn = <Button asChild><Link href="/phase1/new"><Plus /> Bắt đầu quy trình mới</Link></Button>;
  return (
    <PageContainer>
      <PageHeader title={`Chào ${session.name}`} description="Tiếp tục công việc dở dang, duyệt các đề xuất của AI hoặc bắt đầu quy trình mới cho một lớp." actions={newBtn} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Library} label="Lớp học" value={d.stats.classes} />
        <Stat icon={Users} label="Học sinh" value={d.stats.students} />
        <Stat icon={ClipboardCheck} label="Hồ sơ nhóm đã duyệt" value={d.stats.confirmedSessions} />
        <Stat icon={BookOpenCheck} label="KHBD hoàn thành" value={`${d.stats.lessonsDone}/${d.stats.lessons}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Đang thực hiện</h2>
            {d.inProgress.length ? (
              <Card className="divide-y">
                {d.inProgress.map((w) => (
                  <Link key={w.kind + w.id} href={w.href} className="flex flex-col gap-2 p-4 hover:bg-muted/40 sm:flex-row sm:items-center">
                    <span className={cn("w-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", w.kind === "phase1" ? "bg-info-soft text-info" : "bg-success-soft text-success")}>{w.kind === "phase1" ? "PHA 1" : "PHA 2"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{w.title}</p>
                      <p className="text-xs text-muted-foreground">Lớp {w.cls} · cập nhật {timeAgo(w.updatedAt)}</p>
                    </div>
                    <MiniSteps step={w.step} total={w.total} labels={w.kind === "phase1" ? P1 : P2} />
                    <ArrowRight className="hidden size-4 text-muted-foreground sm:block" />
                  </Link>
                ))}
              </Card>
            ) : (
              <EmptyState icon={CheckCircle2} title="Không có quy trình dở dang" description="Bắt đầu phân nhóm cho một lớp để thiết kế KHBD phân hóa." action={newBtn} />
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lớp học gần đây</h2>
              <Link href="/classes" className="text-xs text-primary hover:underline">Tất cả lớp</Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {d.classes.map((c) => (
                <Link key={c.id} href={`/classes/${c.id}`}>
                  <Card className="h-full p-4 transition-colors hover:border-primary/40">
                    <div className="flex items-center gap-2"><p className="font-semibold">Lớp {c.name}</p>{c.isSample && <SampleBadge />}</div>
                    <p className="text-xs text-muted-foreground">{c.schoolYear} · {c._count.students} học sinh</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="flex items-center gap-1.5"><span className={cn("size-2 rounded-full", c.phase1 === "done" ? "bg-success" : c.phase1 === "doing" ? "bg-warning" : "bg-slate-300")} />Pha 1: {c.phase1 === "done" ? "đã có hồ sơ nhóm" : c.phase1 === "doing" ? "đang phân nhóm" : "chưa bắt đầu"}</p>
                      <p className="flex items-center gap-1.5"><span className={cn("size-2 rounded-full", c.lessons ? "bg-success" : "bg-slate-300")} />Pha 2: {c.lessons} KHBD</p>
                    </div>
                  </Card>
                </Link>
              ))}
              {!d.classes.length && <EmptyState className="sm:col-span-2 xl:col-span-3" icon={Library} title="Chưa có lớp học" action={<Button asChild variant="outline"><Link href="/classes">Tạo lớp học</Link></Button>} />}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Chờ bạn duyệt {d.review.length > 0 && <span className="rounded-full bg-warning px-1.5 text-[11px] text-white">{d.review.length}</span>}</h2>
            <Card className="divide-y">
              {d.review.length ? d.review.map((r) => (
                <Link key={r.kind + r.id} href={r.href} className="flex gap-3 p-3 hover:bg-muted/40">
                  {r.kind === "outdated" ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" /> : <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-warning" />}
                  <div className="min-w-0"><p className="text-sm font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.sub}</p></div>
                </Link>
              )) : <p className="p-4 text-sm text-muted-foreground">Không có việc nào chờ duyệt.</p>}
            </Card>
          </section>
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><History className="size-4" /> Hoạt động gần đây</h2>
            <Card className="p-4">
              {d.logs.length ? (
                <ol className="space-y-3 border-l pl-4">
                  {d.logs.map((l) => (
                    <li key={l.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-slate-300" />
                      {l.href ? <Link href={l.href} className="text-sm hover:underline">{l.message}</Link> : <p className="text-sm">{l.message}</p>}
                      <p className="text-[11px] text-muted-foreground">{l.class ? `Lớp ${l.class.name} · ` : ""}{timeAgo(l.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>}
            </Card>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
