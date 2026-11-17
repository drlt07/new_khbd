import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, ChevronRight, Info } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { listCollections } from "@/server/knowledge/knowledge.service";
import { listSubjectsForTeacher } from "@/server/services/subject.service";
import { PageHeader } from "@/components/layout/page-header";
import { CreateCollectionButton } from "@/components/training/collection-buttons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Training" };

export default async function TrainingPage() {
  const session = await requireTeacher();
  const [collections, subjects] = await Promise.all([listCollections(session.teacherId), listSubjectsForTeacher(session.teacherId)]);
  return (
    <>
      <PageHeader
        title="Training – Kho tài liệu chuyên môn"
        description="Tài liệu chuyên môn theo từng môn học (sách giáo viên, SGK, chương trình, tài liệu tập huấn) để AI tham chiếu khi phân tích bài học và soạn KHBD."
        actions={<CreateCollectionButton subjects={subjects} />}
      />
      <Alert tone="info" className="mb-6">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Tài liệu được trích xuất, chia đoạn theo bài học/trang và đánh chỉ mục. Khi soạn KHBD, AI <b>truy xuất các đoạn liên quan và trích dẫn nguồn (tài liệu, trang)</b> —
            đây là cơ chế tham chiếu (RAG), <b>không huấn luyện lại mô hình</b>. Tài liệu chỉ hiển thị với tài khoản của thầy cô.
          </span>
        </p>
      </Alert>
      {collections.length === 0 ? (
        <EmptyState icon={BookMarked} title="Chưa có bộ tài liệu" description="Tạo bộ tài liệu cho từng môn, ví dụ “Ngữ văn 12 – SGV”, rồi tải tài liệu lên." action={<CreateCollectionButton subjects={subjects} />} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((c) => {
            const pages = c.documents.reduce((a, d) => a + (d.pageCount ?? 0), 0);
            const chunks = c.documents.reduce((a, d) => a + d.chunkCount, 0);
            const failed = c.documents.filter((d) => d.processingStatus === "FAILED").length;
            return (
              <Link key={c.id} href={`/training/${c.id}`} className="group">
                <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:border-primary/40">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"><BookMarked className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{c.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge tone="primary">{c.subject?.name ?? "Chưa gắn môn"}</Badge>
                        {c.gradeLevel && <Badge>Khối {c.gradeLevel}</Badge>}
                      </div>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </div>
                  {c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}
                  <p className="mt-auto text-xs tabular-nums text-muted-foreground">
                    {c.documents.length} tài liệu · {pages} trang · {chunks} đoạn đã đánh chỉ mục
                    {failed > 0 && <span className="text-danger"> · {failed} lỗi</span>}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
