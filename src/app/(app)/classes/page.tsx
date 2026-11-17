import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listClasses } from "@/server/services/class.service";
import { PageHeader } from "@/components/layout/page-header";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { Card } from "@/components/ui/card";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Lớp học" };

export default async function ClassesPage() {
  const session = await requireUser();
  const classes = await listClasses(session.userId);
  const lessonCounts = new Map(
    (await prisma.lessonPlan.groupBy({ by: ["groupingId"], where: { grouping: { class: { ownerId: session.userId } } }, _count: true }))
      .map((r) => [r.groupingId, r._count] as const),
  );
  const groupingClass = new Map((await prisma.grouping.findMany({ where: { class: { ownerId: session.userId } }, select: { id: true, classId: true } })).map((g) => [g.id, g.classId]));
  const lessonsByClass = new Map<string, number>();
  lessonCounts.forEach((n, gid) => { const c = groupingClass.get(gid); if (c) lessonsByClass.set(c, (lessonsByClass.get(c) ?? 0) + n); });
  return (
    <>
      <PageHeader title="Lớp học" description="Chọn lớp để làm việc: Pha 1 — đẩy đặc trưng, bảng điểm và chia nhóm; Pha 2 — soạn KHBD theo nhóm." actions={<ClassFormButton />} />
      {classes.length === 0 ? (
        <EmptyState icon={Library} title="Chưa có lớp học" description="Tạo lớp, nhập học sinh kèm đặc trưng, rồi chia nhóm và soạn KHBD." action={<ClassFormButton />} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.id} href={`/classes/${c.id}`} className="group">
              <Card className="h-full p-4 transition-colors group-hover:border-primary/40">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">Lớp {c.name}</p>
                  {c.isSample && <SampleBadge />}
                </div>
                <p className="text-sm text-muted-foreground">Năm học {c.schoolYear}</p>
                <p className="mt-2 text-sm">{c._count.students} học sinh</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-info-soft px-2 py-0.5 text-info">Pha 1 · {c._count.groupings} bộ nhóm</span>
                  <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">Pha 2 · {lessonsByClass.get(c.id) ?? 0} KHBD</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
