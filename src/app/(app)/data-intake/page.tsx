import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listActiveCriteria } from "@/server/services/framework.service";
import { listEvidence } from "@/server/services/evidence.service";
import { PageHeader } from "@/components/layout/page-header";
import { IntakeForm } from "@/components/evidence/intake-form";
import { EvidenceTypeBadge, ProcessingBadge } from "@/components/evidence/evidence-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tiếp nhận dữ liệu" };

export default async function DataIntakePage({ searchParams }: { searchParams: Promise<{ classId?: string; studentId?: string }> }) {
  const session = await requireTeacher();
  const { classId, studentId } = await searchParams;
  const [classes, criteria, recent] = await Promise.all([
    prisma.class.findMany({
      where: { ownerId: session.teacherId, isArchived: false },
      orderBy: [{ schoolYear: "desc" }, { name: "asc" }],
      select: {
        id: true, name: true, schoolYear: true,
        students: { orderBy: { fullName: "asc" }, select: { id: true, fullName: true, studentCode: true } },
        subjects: { select: { subject: { select: { id: true, name: true } } } },
      },
    }),
    listActiveCriteria(session.teacherId),
    listEvidence(session.teacherId, { page: 1 }),
  ]);

  return (
    <>
      <PageHeader
        title="Tiếp nhận dữ liệu"
        description="Giáo viên chủ động cung cấp dữ liệu qua biểu mẫu và tải tài liệu. Hệ thống không phỏng vấn giáo viên; AI chỉ phân tích dữ liệu đã được cung cấp."
      />
      <IntakeForm
        classes={classes.map((c) => ({ ...c, subjects: c.subjects.map((s) => s.subject) }))}
        criteria={criteria}
        defaultClassId={classId}
        defaultStudentId={studentId}
      />
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Dữ liệu gần đây</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link href="/evidence">Quản lý minh chứng</Link></Button>
        </CardHeader>
        <CardContent>
          {recent.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu nào được cung cấp.</p>
          ) : (
            <ul className="divide-y">
              {recent.items.slice(0, 8).map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                  <Link href={`/evidence/${e.id}`} className="flex-1 font-medium hover:text-primary hover:underline">{e.title}</Link>
                  <EvidenceTypeBadge type={e.type} />
                  <ProcessingBadge status={e.processingStatus} />
                  <span className="text-xs text-muted-foreground">Lớp {e.class.name} · {formatDate(e.createdAt, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
