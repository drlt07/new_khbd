import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Shuffle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listGroupings } from "@/server/services/grouping.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Chia nhóm" };

export default async function GroupingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const list = await listGroupings(session.userId, id);
  const newBtn = <Button asChild><Link href={`/classes/${id}/groups/new`}><Plus /> Tạo bộ nhóm</Link></Button>;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Bước 3 của Pha 1. Mỗi bộ nhóm có số nhóm cố định và đặc trưng do thầy cô đặt; dùng lại cho nhiều KHBD.</p>
        {list.length > 0 && newBtn}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Shuffle} title="Chưa có bộ nhóm" description="Đặt số nhóm và đặc trưng từng nhóm — hệ thống xếp học sinh dựa trên đặc trưng và điểm, kèm lý do." action={newBtn} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((g) => (
            <Link key={g.id} href={`/classes/${id}/groups/${g.id}`} className="group">
              <Card className="h-full space-y-2 p-4 transition-colors group-hover:border-primary/40">
                <div className="flex items-start gap-2">
                  <p className="flex-1 font-semibold">{g.title}</p>
                  {g.isSample && <SampleBadge />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[g.subject, g.scoreSheet ? `điểm: ${g.scoreSheet.subject}` : "không dùng điểm", `cập nhật ${formatDate(g.updatedAt)}`].filter(Boolean).join(" · ")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {g.groups.map((x) => <span key={x.name} className="rounded-full bg-muted px-2 py-0.5 text-xs">{x.name} · {x._count.members}</span>)}
                </div>
                <p className="text-xs text-success">{g._count.lessonPlans ? `Đã dùng cho ${g._count.lessonPlans} KHBD` : "Chưa soạn KHBD"}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
