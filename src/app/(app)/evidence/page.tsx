import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Upload } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { evidenceFilterSchema } from "@/schemas/evidence";
import { listEvidence } from "@/server/services/evidence.service";
import { listClasses } from "@/server/services/class.service";
import { PageHeader } from "@/components/layout/page-header";
import { UrlFilters } from "@/components/layout/url-filters";
import { Pagination } from "@/components/layout/pagination";
import { EvidenceTypeBadge, PROCESSING_LABEL, ProcessingBadge, SOURCE_LABEL, formatBytes } from "@/components/evidence/evidence-badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EVIDENCE_TYPE_LABEL } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Minh chứng" };

export default async function EvidencePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const session = await requireTeacher();
  const raw = await searchParams;
  const filter = evidenceFilterSchema.parse(raw);
  const [{ items, total, page, pageCount }, classes] = await Promise.all([listEvidence(session.teacherId, filter), listClasses(session.teacherId)]);
  const hasFilter = Boolean(filter.q || filter.classId || filter.type || filter.status || filter.studentId);

  return (
    <>
      <PageHeader
        title="Minh chứng"
        description={`${total} minh chứng${hasFilter ? " phù hợp bộ lọc" : ""}. Xem trước, phân loại và gắn với học sinh, môn học, tiêu chí.`}
        actions={<Button asChild><Link href="/data-intake"><Upload /> Cung cấp dữ liệu</Link></Button>}
      />
      <Card className="p-4">
        <UrlFilters
          filters={[
            { type: "search", name: "q", placeholder: "Tìm theo tiêu đề, tên tệp, nội dung" },
            { type: "select", name: "classId", label: "Lớp", options: classes.map((c) => ({ value: c.id, label: `${c.name} (${c.schoolYear})` })) },
            { type: "select", name: "type", label: "Loại", options: Object.entries(EVIDENCE_TYPE_LABEL).map(([value, label]) => ({ value, label })) },
            { type: "select", name: "status", label: "Xử lý", options: Object.entries(PROCESSING_LABEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
        <div className="mt-4">
          {items.length === 0 ? (
            <EmptyState icon={FolderOpen} title={hasFilter ? "Không có minh chứng phù hợp" : "Chưa có minh chứng"}
              description={hasFilter ? "Thử thay đổi bộ lọc." : "Tải bảng điểm, bài kiểm tra, sản phẩm học tập hoặc nhập nhận xét để bắt đầu."}
              action={!hasFilter ? <Button asChild size="sm"><Link href="/data-intake">Cung cấp dữ liệu</Link></Button> : undefined} />
          ) : (
            <Table>
              <THead>
                <tr><TH>Minh chứng</TH><TH>Loại</TH><TH className="hidden md:table-cell">Học sinh</TH><TH className="hidden lg:table-cell">Lớp · Môn</TH><TH>Xử lý</TH><TH className="hidden sm:table-cell">Thu thập</TH></tr>
              </THead>
              <TBody>
                {items.map((e) => (
                  <TR key={e.id}>
                    <TD className="max-w-72">
                      <Link href={`/evidence/${e.id}`} className="block truncate font-medium hover:text-primary hover:underline">{e.title}</Link>
                      <p className="truncate text-xs text-muted-foreground">{SOURCE_LABEL[e.source]}{e.fileName ? ` · ${e.fileName} · ${formatBytes(e.sizeBytes)}` : ""}</p>
                    </TD>
                    <TD><EvidenceTypeBadge type={e.type} /></TD>
                    <TD className="hidden max-w-56 md:table-cell">
                      {e.students.length === 0 ? <span className="text-xs text-warning">Chưa gắn học sinh</span>
                        : <span className="line-clamp-2 text-xs">{e.students.map((s) => s.student.fullName).join(", ")}</span>}
                    </TD>
                    <TD className="hidden text-muted-foreground lg:table-cell">{e.class.name}{e.subject ? ` · ${e.subject.name}` : ""}</TD>
                    <TD><ProcessingBadge status={e.processingStatus} /></TD>
                    <TD className="hidden text-muted-foreground sm:table-cell">{formatDate(e.collectedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
          <Pagination page={page} pageCount={pageCount} params={raw} basePath="/evidence" />
        </div>
      </Card>
    </>
  );
}
