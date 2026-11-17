import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenCheck, Check, History, Plus, Shuffle, Sheet, Users } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getClassWorkspace } from "@/server/services/class.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { DeleteClassButton } from "@/components/classes/class-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/badge";
import { LessonStatus, SessionStatus, timeAgo } from "@/components/common/status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lớp học" };

function Section({ icon: Icon, title, action, children }: { icon: typeof Users; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-muted-foreground" />{title}</h2>{action}</div>
      {children}
    </section>
  );
}

export default async function ClassWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const w = await getClassWorkspace(session.userId, id);
  if (!w) notFound();
  const confirmed = w.groupSets.some((g) => g.current.status === "CONFIRMED");
  const flow = [
    { label: "Dữ liệu học sinh", done: w.students > 0 && w.withTraits > 0, href: `/students?classId=${id}` },
    { label: "Phân tích & phân nhóm", done: confirmed, doing: w.groupSets.length > 0, href: w.groupSets[0] ? `/phase1/${(w.groupSets[0].draft ?? w.groupSets[0].current).id}` : `/phase1/new?classId=${id}` },
    { label: "Thiết kế KHBD", done: w.lessons.some((l) => l.status === "DONE"), doing: w.lessons.length > 0, href: confirmed ? `/phase2/new?classId=${id}` : "#", locked: !confirmed },
  ];
  return (
    <PageContainer className="max-w-6xl">
      <PageHeader crumbs={[{ label: "Lớp học của tôi", href: "/classes" }, { label: `Lớp ${w.cls.name}` }]}
        title={<span className="flex items-center gap-2">Lớp {w.cls.name} {w.cls.isSample && <SampleBadge />}</span>}
        description={`Năm học ${w.cls.schoolYear} · ${w.students} học sinh`}
        actions={<><ClassFormButton initial={{ id: w.cls.id, name: w.cls.name, schoolYear: w.cls.schoolYear }} /><DeleteClassButton id={w.cls.id} name={w.cls.name} /></>} />

      {/* Quy trình dạy học của lớp */}
      <Card className="mb-6 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quy trình dạy học của lớp</p>
        <ol className="grid gap-2 sm:grid-cols-3">
          {flow.map((f, i) => (
            <li key={f.label}>
              <Link href={f.href} aria-disabled={f.locked} className={cn("flex items-center gap-3 rounded-lg border p-3 transition-colors", f.locked ? "pointer-events-none opacity-50" : "hover:border-primary/40")}>
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", f.done ? "bg-success text-white" : f.doing ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>{f.done ? <Check className="size-4" /> : i + 1}</span>
                <span className="min-w-0"><span className="block text-sm font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground">{f.done ? "Hoàn thành" : f.locked ? "Cần hồ sơ nhóm đã duyệt" : f.doing ? "Đang thực hiện" : "Chưa bắt đầu"}</span></span>
              </Link>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 lg:col-span-2">
          <Section icon={Users} title="Dữ liệu học sinh" action={<Button asChild size="sm" variant="outline"><Link href={`/students?classId=${id}`}>Quản lý dữ liệu</Link></Button>}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-3"><p className="text-xs text-muted-foreground">Học sinh</p><p className="text-lg font-semibold">{w.students}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">Có đặc trưng</p><p className="text-lg font-semibold">{w.withTraits}/{w.students}</p></Card>
              <Card className="p-3"><p className="text-xs text-muted-foreground">Bảng điểm</p><p className="flex items-center gap-1 text-lg font-semibold"><Sheet className="size-4" />{w.sheets.length}</p></Card>
            </div>
          </Section>

          <Section icon={Shuffle} title="Hồ sơ nhóm (Pha 1)" action={<Button asChild size="sm" variant="outline"><Link href={`/phase1/new?classId=${id}`}><Plus /> Phiên phân nhóm mới</Link></Button>}>
            {w.groupSets.length ? (
              <Card className="divide-y">
                {w.groupSets.map((g) => (
                  <div key={g.current.lineageId} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/phase1/${g.current.id}`} className="font-medium hover:underline">{g.current.title}</Link>
                      <SessionStatus status={g.current.status} version={g.current.version} />
                      {g.draft && g.draft.id !== g.current.id && <Link href={`/phase1/${g.draft.id}`}><SessionStatus status="DRAFT" version={g.draft.version} /></Link>}
                      <span className="ml-auto text-xs text-muted-foreground">{g.current._count.lessonPlans} KHBD · {timeAgo(g.current.updatedAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">{g.current.groups.map((x) => <span key={x.name} className="rounded-full bg-muted px-2 py-0.5 text-xs">{x.name} · {x._count.members}</span>)}</div>
                    {g.versions.length > 1 && <p className="text-xs text-muted-foreground">Lịch sử phiên bản: {g.versions.map((v) => <Link key={v.id} href={`/phase1/${v.id}`} className="mr-2 hover:underline">v{v.version}</Link>)}</p>}
                  </div>
                ))}
              </Card>
            ) : <Card className="p-4 text-sm text-muted-foreground">Chưa có phiên phân nhóm nào.</Card>}
          </Section>

          <Section icon={BookOpenCheck} title="Kế hoạch bài dạy (Pha 2)" action={confirmed && <Button asChild size="sm" variant="outline"><Link href={`/phase2/new?classId=${id}`}><Plus /> KHBD mới</Link></Button>}>
            {w.lessons.length ? (
              <Card className="divide-y">
                {w.lessons.map((l) => (
                  <Link key={l.id} href={`/phase2/${l.id}`} className="flex flex-wrap items-center gap-2 p-3 hover:bg-muted/40">
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{l.title}</span><span className="text-xs text-muted-foreground">{l.subject} · hồ sơ nhóm “{l.session.title}” v{l.session.version}</span></span>
                    <LessonStatus status={l.status} outdated={l.session.status === "SUPERSEDED"} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </Card>
            ) : <Card className="p-4 text-sm text-muted-foreground">{confirmed ? "Chưa có KHBD." : "Cần duyệt hồ sơ nhóm ở Pha 1 trước khi thiết kế KHBD."}</Card>}
          </Section>
        </div>

        <Section icon={History} title="Lịch sử chỉnh sửa">
          <Card className="p-4">
            {w.logs.length ? (
              <ol className="space-y-3 border-l pl-4">
                {w.logs.map((l) => (
                  <li key={l.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-slate-300" />
                    {l.href ? <Link href={l.href} className="text-sm hover:underline">{l.message}</Link> : <p className="text-sm">{l.message}</p>}
                    <p className="text-[11px] text-muted-foreground">{timeAgo(l.createdAt)}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">Chưa có hoạt động.</p>}
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}
