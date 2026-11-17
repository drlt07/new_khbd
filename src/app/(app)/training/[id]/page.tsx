import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ChevronLeft, FileStack, Layers, ListTree } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getCollection } from "@/server/knowledge/knowledge.service";
import { listSubjectsForTeacher } from "@/server/services/subject.service";
import { PageHeader } from "@/components/layout/page-header";
import { CollectionActions } from "@/components/training/collection-buttons";
import { DocumentUploader } from "@/components/training/document-uploader";
import { DocumentRowActions } from "@/components/training/document-row-actions";
import { KnowledgeSearch } from "@/components/training/knowledge-search";
import { ProcessingBadge, formatBytes } from "@/components/evidence/evidence-badges";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata: Metadata = { title: "Bộ tài liệu training" };

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const c = await getCollection(session.teacherId, id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const subjects = await listSubjectsForTeacher(session.teacherId);
  const pages = c.documents.reduce((a, d) => a + (d.pageCount ?? 0), 0);
  const chunks = c.documents.reduce((a, d) => a + d.chunkCount, 0);
  const realLessons = c.lessons.filter((l) => l.label.startsWith("Bài"));
  const lessonOptions = [...new Map(c.lessons.map((l) => [l.label, l])).values()].map((l) => ({
    value: l.label,
    label: `${l.label}${l.title ? ` – ${l.title.toLowerCase().replace(/^./, (m) => m.toUpperCase())}` : ""}`.slice(0, 60),
  }));
  const volumes = [...new Set(c.lessons.map((l) => l.volume ?? "Không rõ tập"))];

  return (
    <>
      <Link href="/training" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Training
      </Link>
      <PageHeader
        title={c.name}
        description={c.description ?? undefined}
        actions={<CollectionActions subjects={subjects} collection={{ id: c.id, name: c.name, description: c.description, subjectId: c.subjectId, gradeLevel: c.gradeLevel }} />}
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge tone="primary">{c.subject?.name ?? "Chưa gắn môn"}</Badge>
        {c.gradeLevel && <Badge>Khối {c.gradeLevel}</Badge>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tài liệu" value={c.documents.length} icon={FileStack} />
        <StatCard label="Trang" value={pages} icon={BookOpen} accent="info" />
        <StatCard label="Bài học nhận diện" value={realLessons.length} icon={ListTree} accent="success" />
        <StatCard label="Đoạn đã đánh chỉ mục" value={chunks} icon={Layers} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thử truy xuất tài liệu</CardTitle>
              <CardDescription>Kiểm tra AI sẽ lấy được những đoạn nào khi gặp một chủ đề — tìm có dấu hoặc không dấu, kèm trích dẫn trang.</CardDescription>
            </CardHeader>
            <CardContent>
              {chunks > 0 ? <KnowledgeSearch collectionId={c.id} lessons={lessonOptions} /> : <p className="text-sm text-muted-foreground">Thêm tài liệu để bắt đầu tra cứu.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tài liệu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {c.documents.length === 0 ? (
                <EmptyState icon={FileStack} title="Chưa có tài liệu" description="Tải sách giáo viên, SGK hoặc tài liệu chuyên môn của môn học." />
              ) : (
                <Table>
                  <THead><tr><TH>Tài liệu</TH><TH>Tập</TH><TH className="hidden md:table-cell">Trang sách</TH><TH className="hidden md:table-cell">Đoạn</TH><TH>Trạng thái</TH><TH className="w-20" /></tr></THead>
                  <TBody>
                    {c.documents.map((d) => (
                      <TR key={d.id}>
                        <TD className="max-w-72">
                          <Link href={`/training/documents/${d.id}`} className="block truncate font-medium hover:text-primary hover:underline">{d.title}</Link>
                          <p className="text-xs text-muted-foreground">{d.pageCount ?? "?"} trang PDF · {formatBytes(d.sizeBytes)}</p>
                          {d.processingError && <p className="text-xs text-danger">{d.processingError}</p>}
                        </TD>
                        <TD>{d.volume ?? <span className="text-muted-foreground">—</span>}</TD>
                        <TD className="hidden tabular-nums md:table-cell">{d.bookPageStart != null ? `${d.bookPageStart}–${d.bookPageEnd}` : "—"}</TD>
                        <TD className="hidden tabular-nums md:table-cell">{d.chunkCount}</TD>
                        <TD><ProcessingBadge status={d.processingStatus} /></TD>
                        <TD><DocumentRowActions id={d.id} title={d.title} /></TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
              <DocumentUploader collectionId={c.id} />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Mục lục nhận diện</CardTitle>
            <CardDescription>Bài học được nhận diện tự động từ tài liệu (ghép các phần của cùng một tập).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {c.lessons.length === 0 && <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>}
            {volumes.map((v) => (
              <div key={v}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{v}</p>
                <ul className="space-y-1.5">
                  {c.lessons.filter((l) => (l.volume ?? "Không rõ tập") === v).map((l) => (
                    <li key={l.label} className="rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{l.label}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">tr. {l.fromPage}–{l.toPage}</span>
                      </div>
                      {l.title && <p className="text-xs text-muted-foreground">{l.title}</p>}
                      <p className="text-xs text-muted-foreground">{l.chunks} đoạn</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
