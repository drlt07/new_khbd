import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
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
  return (
    <>
      <PageHeader title="Lớp học" actions={<ClassFormButton />} />
      {classes.length === 0 ? (
        <EmptyState icon={Library} title="Chưa có lớp học" description="Tạo lớp rồi thêm học sinh để bắt đầu chia nhóm." action={<ClassFormButton />} />
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
                <p className="mt-2 text-sm">{c._count.students} học sinh · {c._count.groupings} lần chia nhóm</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
