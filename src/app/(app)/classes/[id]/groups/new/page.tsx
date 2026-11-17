import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { classKeywordSuggestions } from "@/server/services/views";
import { NewGroupingForm } from "@/components/groups/new-grouping-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tạo bộ nhóm" };

export default async function NewGroupingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const [students, sheets, keywords] = await Promise.all([
    prisma.student.findMany({ where: { classId: id }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.scoreSheet.findMany({ where: { classId: id }, orderBy: { createdAt: "desc" }, select: { id: true, subject: true, fileName: true } }),
    classKeywordSuggestions(id),
  ]);
  if (students.length < 2)
    return <EmptyState icon={Users} title="Lớp chưa đủ học sinh" description="Cần ít nhất 2 học sinh để chia nhóm." action={<Button asChild><Link href={`/classes/${id}/students`}>Nhập học sinh</Link></Button>} />;
  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-1 text-lg font-semibold">Tạo bộ nhóm</h2>
      <p className="mb-4 text-sm text-muted-foreground">Thầy cô quyết định số nhóm và đặc trưng của từng nhóm. Hệ thống xếp học sinh, ghi lý do; thầy cô chỉnh lại ở bước sau.</p>
      <NewGroupingForm classId={id} students={students} sheets={sheets} keywordSuggestions={keywords} />
    </div>
  );
}
