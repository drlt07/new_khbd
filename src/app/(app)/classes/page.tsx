import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { Card } from "@/components/ui/card";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Lớp học của tôi" };

export default async function ClassesPage() {
  const session = await requireUser();
  const classes = await prisma.class.findMany({
    where: { ownerId: session.userId }, orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
    include: { _count: { select: { students: true } }, groupings: { select: { status: true, _count: { select: { lessonPlans: true } } } } },
  });
  return (
    <PageContainer>
      <PageHeader title="Lớp học của tôi" description="Mỗi lớp là một không gian làm việc: dữ liệu học sinh, hồ sơ nhóm và các KHBD được liên kết với nhau." actions={<ClassFormButton />} />
      {classes.length === 0 ? (
        <EmptyState icon={Library} title="Chưa có lớp học" description="Tạo lớp, nhập học sinh kèm điểm và đặc trưng để bắt đầu quy trình." action={<ClassFormButton />} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const confirmed = c.groupings.filter((g) => g.status === "CONFIRMED").length;
            const drafts = c.groupings.filter((g) => g.status === "DRAFT").length;
            const lessons = c.groupings.reduce((a, g) => a + g._count.lessonPlans, 0);
            return (
              <Link key={c.id} href={`/classes/${c.id}`} className="group">
                <Card className="h-full p-4 transition-colors group-hover:border-primary/40">
                  <div className="flex items-center gap-2"><p className="text-lg font-semibold">Lớp {c.name}</p>{c.isSample && <SampleBadge />}</div>
                  <p className="text-sm text-muted-foreground">Năm học {c.schoolYear} · {c._count.students} học sinh</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full bg-info-soft px-2 py-0.5 text-info">Pha 1 · {confirmed} hồ sơ nhóm{drafts ? ` · ${drafts} nháp` : ""}</span>
                    <span className="rounded-full bg-success-soft px-2 py-0.5 text-success">Pha 2 · {lessons} KHBD</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
