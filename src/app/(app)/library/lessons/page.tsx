import type { Metadata } from "next";
import Link from "next/link";
import { BookCopy } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listLessons } from "@/server/services/lesson.service";
import { listClasses } from "@/server/services/class.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { UrlFilters } from "@/components/layout/url-filters";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { LessonStatus } from "@/components/common/status";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Kho KHBD" };

export default async function LessonLibraryPage({ searchParams }: { searchParams: Promise<{ classId?: string; status?: string; q?: string }> }) {
  const user = await requireUser();
  const { classId, status, q } = await searchParams;
  const [all, classes] = await Promise.all([listLessons(user.userId, { classId, status: (["DRAFT", "REVIEW", "DONE"] as const).find((s) => s === status) }), listClasses(user.userId)]);
  const items = q ? all.filter((l) => `${l.title} ${l.subject}`.toLowerCase().includes(q.toLowerCase())) : all;
  return (
    <PageContainer>
      <PageHeader title="Kho KHBD" description="Tất cả kế hoạch bài dạy, gắn với lớp và phiên bản hồ sơ nhóm đã dùng." />
      <div className="mb-4"><UrlFilters filters={[
        { type: "search", name: "q", placeholder: "Tìm theo tên bài, môn" },
        { type: "select", name: "classId", label: "Lớp", options: classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` })) },
        { type: "select", name: "status", label: "Trạng thái", options: [{ value: "DRAFT", label: "Bản nháp" }, { value: "REVIEW", label: "Chờ duyệt" }, { value: "DONE", label: "Hoàn thành" }] },
      ]} /></div>
      {items.length ? (
        <Card>
          <Table>
            <THead><TR><TH>Bài học</TH><TH>Lớp</TH><TH>Hồ sơ nhóm</TH><TH>Trạng thái</TH><TH>Cập nhật</TH><TH /></TR></THead>
            <TBody>
              {items.map((l) => (
                <TR key={l.id}>
                  <TD><Link href={`/phase2/${l.id}`} className="font-medium hover:underline">{l.title}</Link><p className="text-xs text-muted-foreground">{l.subject} · {l.periods} tiết</p></TD>
                  <TD>{l.session.class.name}</TD>
                  <TD className="text-xs">{l.session.title} · v{l.session.version}</TD>
                  <TD><LessonStatus status={l.status} outdated={l.outdated} /></TD>
                  <TD className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(l.updatedAt)}</TD>
                  <TD className="whitespace-nowrap text-right text-xs"><a href={`/api/lessons/${l.id}/export`} className="text-primary hover:underline" download>Word</a> · <a href={`/phase2/${l.id}/print`} target="_blank" rel="noreferrer" className="text-primary hover:underline">PDF</a></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      ) : <EmptyState icon={BookCopy} title="Không có KHBD phù hợp" />}
    </PageContainer>
  );
}
