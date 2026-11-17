import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Shuffle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listGroupings } from "@/server/services/grouping.service";
import { PageHeader } from "@/components/layout/page-header";
import { METHOD_INFO } from "@/components/groups/methods";
import { Card } from "@/components/ui/card";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Chia nhóm" };

export default async function GroupsPage() {
  const session = await requireUser();
  const groupings = await listGroupings(session.userId);
  const newBtn = <Button asChild><Link href="/groups/new"><Plus /> Chia nhóm mới</Link></Button>;
  return (
    <>
      <PageHeader title="Chia nhóm" description="Chia học sinh thành các nhóm hoạt động cho từng bài học." actions={newBtn} />
      {groupings.length === 0 ? (
        <EmptyState icon={Shuffle} title="Chưa có lần chia nhóm nào" description="Chọn lớp, nhập tên bài học, chọn cách chia — hệ thống gợi ý, thầy cô kéo thả để chỉnh." action={newBtn} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groupings.map((g) => {
            const students = g.groups.reduce((a, x) => a + x._count.members, 0);
            return (
              <Link key={g.id} href={`/groups/${g.id}`} className="group">
                <Card className="h-full space-y-2 p-4 transition-colors group-hover:border-primary/40">
                  <p className="font-semibold leading-snug">{g.title}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone="primary">Lớp {g.class.name}</Badge>
                    <Badge>{METHOD_INFO[g.method].label}</Badge>
                    {g.isSample && <SampleBadge />}
                  </div>
                  <p className="text-xs text-muted-foreground">{g.groups.length} nhóm · {students} học sinh · cập nhật {formatDate(g.updatedAt)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
