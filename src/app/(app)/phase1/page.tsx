import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Shuffle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listSessions } from "@/server/services/session.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniSteps, SessionStatus, timeAgo } from "@/components/common/status";

export const metadata: Metadata = { title: "Phân tích & phân nhóm" };

export default async function Phase1Page() {
  const session = await requireUser();
  const all = await listSessions(session.userId);
  const byClass = new Map<string, typeof all>();
  all.forEach((s) => byClass.set(s.class.name, [...(byClass.get(s.class.name) ?? []), s]));
  const newBtn = <Button asChild><Link href="/phase1/new"><Plus /> Phiên phân nhóm mới</Link></Button>;
  return (
    <PageContainer>
      <PageHeader eyebrow={<span className="text-xs font-semibold uppercase tracking-wide text-info">01 · Pha 1</span>} title="Phân tích & phân nhóm"
        description="Hồ sơ học sinh → Tiêu chí → Phân nhóm → Duyệt nhóm. Mỗi lần sửa một bộ nhóm đã duyệt sẽ tạo phiên bản mới." actions={newBtn} />
      {!all.length ? <EmptyState icon={Shuffle} title="Chưa có phiên phân nhóm" description="Bắt đầu bằng cách chọn lớp và nhập dữ liệu học sinh." action={newBtn} /> : (
        <div className="space-y-6">
          {[...byClass.entries()].map(([cls, list]) => (
            <section key={cls}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lớp {cls}</h2>
              <Card className="divide-y">
                {list.map((s) => (
                  <Link key={s.id} href={`/phase1/${s.id}`} className="flex flex-col gap-2 p-4 hover:bg-muted/40 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">{s.title} <SessionStatus status={s.status} version={s.version} /></p>
                      <p className="mt-1 flex flex-wrap gap-1">{s.groups.map((g) => <span key={g.name} className="rounded-full bg-muted px-2 py-0.5 text-xs">{g.name} · {g._count.members}</span>)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {s.status === "DRAFT" ? <MiniSteps step={s.step} total={4} labels={["Dữ liệu", "Tiêu chí", "Phân nhóm", "Duyệt nhóm"]} /> : <span>{s._count.lessonPlans} KHBD</span>}
                      <span>{timeAgo(s.updatedAt)}</span>
                    </div>
                  </Link>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
