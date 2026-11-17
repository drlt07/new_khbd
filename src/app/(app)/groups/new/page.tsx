import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { NewGroupingForm } from "@/components/groups/new-grouping-form";

export const metadata: Metadata = { title: "Chia nhóm mới" };

export default async function NewGroupingPage({ searchParams }: { searchParams: Promise<{ classId?: string }> }) {
  const session = await requireUser();
  const { classId } = await searchParams;
  const classes = await prisma.class.findMany({
    where: { ownerId: session.userId, students: { some: {} } },
    orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
    select: { id: true, name: true, schoolYear: true, students: { orderBy: { fullName: "asc" }, select: { id: true, fullName: true } } },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/groups" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Chia nhóm</Link>
      <PageHeader title="Chia nhóm mới" description="Hệ thống gợi ý dựa trên sở thích, thế mạnh và nhu cầu hỗ trợ — không dựa trên điểm số. Thầy cô chỉnh sửa ở bước sau." />
      <NewGroupingForm classes={classes} defaultClassId={classId} />
    </div>
  );
}
