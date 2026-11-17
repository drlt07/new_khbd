import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getEvidence } from "@/server/services/evidence.service";
import { listActiveCriteria } from "@/server/services/framework.service";
import type { TableSheet } from "@/server/extraction";
import type { StudentMatch } from "@/server/extraction/student-matcher";
import { PageHeader } from "@/components/layout/page-header";
import { EvidencePreview } from "@/components/evidence/evidence-preview";
import { EvidenceEditForm } from "@/components/evidence/evidence-edit-form";
import { EvidenceActions } from "@/components/evidence/evidence-actions";
import { EvidenceTypeBadge, ProcessingBadge, SOURCE_LABEL, formatBytes } from "@/components/evidence/evidence-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Chi tiết minh chứng" };

export default async function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const ev = await getEvidence(session.teacherId, id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const [students, classSubjects, criteria] = await Promise.all([
    prisma.student.findMany({ where: { classId: ev.classId }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, studentCode: true } }),
    prisma.classSubject.findMany({ where: { classId: ev.classId }, select: { subject: { select: { id: true, name: true } } } }),
    listActiveCriteria(session.teacherId),
  ]);
  // Bao gồm cả tiêu chí đã bị ẩn nhưng đang gắn với minh chứng này
  const criteriaOptions = [...criteria, ...ev.criteria.filter((c) => !criteria.some((x) => x.id === c.id))];
  const data = (ev.extractedData ?? {}) as { tables?: TableSheet[]; studentMatches?: StudentMatch[]; pageCount?: number | null };
  const nameById = new Map(students.map((s) => [s.id, s.fullName]));
  const matches = (data.studentMatches ?? [])
    .filter((m) => nameById.has(m.studentId))
    .map((m) => ({ ...m, fullName: nameById.get(m.studentId)! }));
  const isText = !ev.storageKey;

  return (
    <>
      <Link href="/evidence" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Minh chứng
      </Link>
      <PageHeader
        title={ev.title}
        description={[`Lớp ${ev.class.name}`, ev.subject?.name, SOURCE_LABEL[ev.source], `Thu thập ${formatDate(ev.collectedAt)}`].filter(Boolean).join(" · ")}
        actions={<EvidenceActions id={ev.id} hasFile={!!ev.storageKey} title={ev.title} />}
      />
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <EvidenceTypeBadge type={ev.type} />
        <ProcessingBadge status={ev.processingStatus} />
        {ev.fileName && <span className="text-xs text-muted-foreground">{ev.fileName} · {formatBytes(ev.sizeBytes)}{data.pageCount ? ` · ${data.pageCount} trang` : ""}</span>}
      </div>
      {ev.processingError && <Alert tone="danger" className="mb-4">{ev.processingError}</Alert>}
      {ev.extractionNote && <Alert tone="info" className="mb-4">{ev.extractionNote}</Alert>}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle>Xem trước</CardTitle></CardHeader>
            <CardContent>
              <EvidencePreview id={ev.id} mimeType={ev.mimeType} title={ev.title} text={ev.textContent} tables={data.tables ?? []} />
            </CardContent>
          </Card>
          {ev.storageKey && ev.textContent && !(data.tables?.length) && (
            <Card>
              <CardHeader><CardTitle>Văn bản trích xuất</CardTitle></CardHeader>
              <CardContent>
                <details>
                  <summary className="cursor-pointer text-sm text-primary">Hiện {ev.textContent.length.toLocaleString("vi-VN")} ký tự đã trích xuất</summary>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-sans text-sm">{ev.textContent}</pre>
                </details>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Nguồn dữ liệu</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[9rem_1fr] gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Người cung cấp</dt><dd>{ev.uploadedBy.user.fullName}</dd>
                <dt className="text-muted-foreground">Hình thức</dt><dd>{SOURCE_LABEL[ev.source]}</dd>
                <dt className="text-muted-foreground">Tải lên lúc</dt><dd>{formatDate(ev.createdAt, true)}</dd>
                <dt className="text-muted-foreground">Trích xuất lúc</dt><dd>{ev.extractedAt ? formatDate(ev.extractedAt, true) : "—"}</dd>
              </dl>
            </CardContent>
          </Card>
        </div>
        <div className="min-w-0">
          <EvidenceEditForm
            key={`${ev.id}-${ev.extractedAt?.toISOString() ?? ""}`}
            initial={{
              id: ev.id, title: ev.title, description: ev.description, type: ev.type, subjectId: ev.subjectId,
              collectedAt: ev.collectedAt, studentIds: ev.students.map((s) => s.studentId), criteriaIds: ev.criteria.map((c) => c.id),
              textContent: ev.textContent, isText,
            }}
            students={students}
            subjects={classSubjects.map((c) => c.subject)}
            criteria={criteriaOptions}
            matches={matches}
          />
        </div>
      </div>
    </>
  );
}
