import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getDocument, listDocumentChunks, type OutlineItem } from "@/server/knowledge/knowledge.service";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/layout/pagination";
import { UrlFilters } from "@/components/layout/url-filters";
import { DocumentMetaForm } from "@/components/training/document-meta-form";
import { ProcessingBadge, formatBytes } from "@/components/evidence/evidence-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Tài liệu training" };

export default async function KnowledgeDocumentPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ lesson?: string; page?: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const sp = await searchParams;
  const doc = await getDocument(session.teacherId, id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const page = Math.max(1, Number(sp.page) || 1);
  const chunks = await listDocumentChunks(session.teacherId, id, { lesson: sp.lesson || undefined, page });
  const outline = (doc.outline ?? []) as OutlineItem[];
  const lessonLabels = [...new Set(outline.filter((o) => o.kind === "lesson").map((o) => o.label))];
  const isPdf = doc.mimeType === "application/pdf";

  return (
    <>
      <Link href={`/training/${doc.collection.id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> {doc.collection.name}
      </Link>
      <PageHeader
        title={doc.title}
        description={[doc.volume, doc.bookPageStart != null ? `trang sách ${doc.bookPageStart}–${doc.bookPageEnd}` : null, `${doc.pageCount ?? "?"} trang PDF`, formatBytes(doc.sizeBytes)].filter(Boolean).join(" · ")}
        actions={isPdf ? <Button asChild variant="outline"><a href={`/api/training/documents/${doc.id}/file`} target="_blank" rel="noopener"><ExternalLink /> Mở tệp gốc</a></Button> : undefined}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <ProcessingBadge status={doc.processingStatus} />
        <span>{doc.chunkCount} đoạn · {(doc.charCount ?? 0).toLocaleString("vi-VN")} ký tự</span>
        {doc.processedAt && <span>· xử lý lúc {formatDate(doc.processedAt, true)}</span>}
      </div>
      {doc.processingError && <Alert tone="danger" className="mb-4">{doc.processingError}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Thông tin</CardTitle></CardHeader>
            <CardContent><DocumentMetaForm doc={doc} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Cấu trúc nhận diện</CardTitle></CardHeader>
            <CardContent>
              {outline.length === 0 ? <p className="text-sm text-muted-foreground">Không nhận diện được đề mục.</p> : (
                <ul className="max-h-[32rem] space-y-0.5 overflow-y-auto text-sm">
                  {outline.map((o, i) => (
                    <li key={i} className={o.kind === "lesson" ? "mt-2 font-medium first:mt-0" : "pl-4 text-muted-foreground"}>
                      {o.label}{o.title ? ` – ${o.title}` : ""} <span className="text-xs tabular-nums text-muted-foreground">· tr. {o.bookPage ?? o.pdfPage}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <Card className="min-w-0">
          <CardHeader className="gap-3">
            <CardTitle>Các đoạn đã đánh chỉ mục ({chunks.total})</CardTitle>
            <UrlFilters filters={[{ type: "select", name: "lesson", label: "Bài", options: lessonLabels.map((l) => ({ value: l, label: l })) }]} />
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {chunks.items.map((ch) => (
                <li key={ch.id} className="rounded-lg border p-3">
                  <div className="mb-1.5 flex flex-wrap gap-1.5 text-xs">
                    <span className="font-semibold tabular-nums text-muted-foreground">#{ch.chunkIndex + 1}</span>
                    {ch.lessonLabel && <Badge tone="primary">{ch.lessonLabel}</Badge>}
                    {ch.heading && <Badge>{ch.heading}</Badge>}
                    <span className="text-muted-foreground">tr. {ch.bookPage ?? ch.pdfPage}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{ch.content}</p>
                </li>
              ))}
            </ol>
            <Pagination page={chunks.page} pageCount={chunks.pageCount} params={{ lesson: sp.lesson }} basePath={`/training/documents/${doc.id}`} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
