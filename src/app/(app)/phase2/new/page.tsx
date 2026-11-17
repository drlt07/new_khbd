import type { Metadata } from "next";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { confirmedSessions } from "@/server/services/session.service";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { NewLessonForm } from "@/components/phase2/new-lesson-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "KHBD mới" };

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ sessionId?: string; classId?: string }> }) {
  const user = await requireUser();
  const { sessionId, classId } = await searchParams;
  const sessions = await confirmedSessions(user.userId, classId);
  return (
    <PageContainer className="max-w-5xl">
      <PageHeader crumbs={[{ label: "Thiết kế KHBD", href: "/phase2" }, { label: "KHBD mới" }]} eyebrow={<span className="text-xs font-semibold uppercase tracking-wide text-success">02 · Pha 2</span>}
        title="Thiết kế KHBD phân hóa" description="Một KHBD thống nhất cho cả lớp, với nhiệm vụ học tập được phân hóa có chủ đích cho từng nhóm." />
      {sessions.length ? (
        <NewLessonForm defaultSessionId={sessionId} sessions={sessions.map((s) => ({ id: s.id, title: s.title, version: s.version, subject: s.subject, className: s.class.name, groups: s.groups.map((g) => ({ name: g.name, count: g._count.members, competency: g.competency })) }))} />
      ) : (
        <EmptyState icon={Shuffle} title="Chưa có hồ sơ nhóm đã duyệt" description="Pha 2 dùng Hồ sơ nhóm đã được duyệt ở Pha 1. Hãy hoàn thành phân nhóm trước." action={<Button asChild><Link href="/phase1">Đến Phân tích & phân nhóm</Link></Button>} />
      )}
    </PageContainer>
  );
}
