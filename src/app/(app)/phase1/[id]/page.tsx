import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getSession } from "@/server/services/session.service";
import { listClasses } from "@/server/services/class.service";
import { traitSuggestions } from "@/server/services/views";
import { engineLabel, getEngine } from "@/server/ai/engine";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Stepper, type StepState } from "@/components/phase1/stepper";
import { SessionActions } from "@/components/phase1/session-actions";
import { StepData } from "@/components/phase1/step-data";
import { StepCriteria } from "@/components/phase1/step-criteria";
import { StepAnalysis } from "@/components/phase1/step-analysis";
import { StepReview } from "@/components/phase1/step-review";
import { SessionStatus } from "@/components/common/status";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Phân tích & phân nhóm" };

export default async function SessionPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string; confirmed?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { step: rawStep, confirmed } = await searchParams;
  const d = await getSession(user.userId, id).catch(() => null);
  if (!d) notFound();
  const { session: s, students, versions, sheets, vocab } = d;
  const readOnly = s.status !== "DRAFT";
  const states: StepState[] = [
    { n: 1, done: s.step >= 2, locked: null },
    { n: 2, done: s.step >= 3 && s.groups.length >= 2, locked: s.step >= 2 ? null : students.length < 2 ? "Cần ít nhất 2 học sinh" : "Xác nhận dữ liệu ở bước 1" },
    { n: 3, done: !!s.analyzedAt, locked: s.step >= 3 ? null : "Lưu tiêu chí nhóm trước" },
    { n: 4, done: s.status !== "DRAFT", locked: s.analyzedAt ? null : "Chạy phân nhóm trước" },
  ];
  const wanted = Number(rawStep) || (readOnly ? 4 : Math.min(s.step, 4));
  const step = states.find((x) => x.n === wanted && !x.locked) ? wanted : Math.max(...states.filter((x) => !x.locked).map((x) => x.n));
  const latestDraft = versions.find((v) => v.status === "DRAFT");
  const latestConfirmed = versions.find((v) => v.status === "CONFIRMED");
  const [classes, suggestions] = await Promise.all([listClasses(user.userId), traitSuggestions(user.userId)]);
  const groups = s.groups.map((g) => ({
    id: g.id, name: g.name, description: g.description ?? "", keywords: g.keywords, scoreMin: g.scoreMin, scoreMax: g.scoreMax, forSupport: g.forSupport, maxSize: g.maxSize,
    criteria: g.criteria as { source?: string[]; scoreMin?: number | null; scoreMax?: number | null; keywords?: string[]; forSupport?: boolean } | null,
    competency: g.competency, strengths: g.strengths, difficulties: g.difficulties, needs: g.needs, supportGoal: g.supportGoal, avgScore: g.avgScore,
    members: g.members,
  }));

  return (
    <PageContainer>
      <PageHeader
        crumbs={[{ label: "Phân tích & phân nhóm", href: "/phase1" }, { label: `Lớp ${s.class.name}`, href: `/classes/${s.class.id}` }, { label: s.title }]}
        eyebrow={<span className="text-xs font-semibold uppercase tracking-wide text-info">Pha 1 · Phân tích & phân nhóm</span>}
        title={<span className="flex flex-wrap items-center gap-2">{s.title} <SessionStatus status={s.status} version={s.version} /></span>}
        description={`Lớp ${s.class.name} · ${students.length} học sinh${s.subject ? ` · ${s.subject}` : ""}${s.engine ? ` · phân nhóm bởi ${engineLabel(s.engine)}` : ""}`}
        actions={<SessionActions id={s.id} status={s.status} versions={versions} lessonCount={s.lessonPlans.length} />}
      />
      {s.status === "SUPERSEDED" && (
        <Alert tone="warning" className="mb-4">Đây là phiên bản cũ (chỉ xem). {latestConfirmed && <Link className="font-medium underline" href={`/phase1/${latestConfirmed.id}`}>Mở phiên bản đang dùng v{latestConfirmed.version}</Link>}{s.lessonPlans.length > 0 && ` · ${s.lessonPlans.length} KHBD vẫn đang dùng phiên bản này và cần cập nhật.`}</Alert>
      )}
      {s.status === "CONFIRMED" && latestDraft && (
        <Alert tone="info" className="mb-4">Đang có phiên bản nháp v{latestDraft.version}. <Link className="font-medium underline" href={`/phase1/${latestDraft.id}`}>Tiếp tục chỉnh sửa</Link></Alert>
      )}
      <Stepper base={`/phase1/${s.id}`} current={step} states={states} />
      <div className="mt-6">
        {step === 1 && <StepData id={s.id} classId={s.class.id} readOnly={readOnly} students={students} sheets={sheets} scoreSheetId={s.scoreSheetId} classes={classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }))} suggestions={suggestions} />}
        {step === 2 && <StepCriteria id={s.id} readOnly={readOnly} initialGroups={groups} balanceSizes={s.balanceSizes} vocab={vocab} hasScores={!!s.scoreSheetId} studentCount={students.length} />}
        {step === 3 && <StepAnalysis id={s.id} readOnly={readOnly} engine={s.engine} engineNow={getEngine()} analyzedAt={s.analyzedAt?.toISOString() ?? null} groups={groups} students={students} />}
        {step === 4 && <StepReview key={s.updatedAt.toISOString()} id={s.id} status={s.status} groups={groups} students={students} confirmedNote={confirmed == null ? null : Number(confirmed) > 0 ? `Đã lưu hồ sơ nhóm. ${confirmed} KHBD đang dùng phiên bản trước đã được đánh dấu “cần cập nhật”.` : "Đã lưu hồ sơ nhóm — sẵn sàng thiết kế KHBD ở Pha 2."} />}
      </div>
    </PageContainer>
  );
}
