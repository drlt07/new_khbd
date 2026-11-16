import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FolderOpen, History, Upload } from "lucide-react";
import type { ProfileDimension } from "@prisma/client";
import { requireTeacher } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getStudentProfile } from "@/server/services/profile.service";
import { listActiveCriteria } from "@/server/services/framework.service";
import { listClasses } from "@/server/services/class.service";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileTabs, type TabDef } from "@/components/profile/profile-tabs";
import { ProfileItemList } from "@/components/profile/profile-item-list";
import { ProfileStatusControl } from "@/components/profile/profile-status-control";
import { ProfileTextForm } from "@/components/profile/profile-text-form";
import { ObservationsPanel } from "@/components/profile/observations-panel";
import { AcademicResultsPanel } from "@/components/profile/academic-results-panel";
import { toItemViews } from "@/components/profile/to-item-views";
import { EditStudentButton } from "@/components/students/edit-student-button";
import { ProfileStatusBadge } from "@/components/students/profile-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AUDIT_ACTION_LABEL, DIMENSION_LABEL, EVIDENCE_TYPE_LABEL } from "@/lib/labels";
import { DIMENSION_ORDER } from "@/config/default-framework";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Hồ sơ học sinh" };

export default async function StudentProfilePage({
  params, searchParams,
}: { params: Promise<{ studentId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const session = await requireTeacher();
  const { studentId } = await params;
  const { tab } = await searchParams;
  const data = await getStudentProfile(session.teacherId, studentId).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const [criteria, classes] = await Promise.all([listActiveCriteria(session.teacherId), listClasses(session.teacherId)]);
  const { student: s, history } = data;
  const items = toItemViews(s);
  const subjects = s.class.subjects.map((cs) => cs.subject);
  const listProps = { studentId: s.id, criteria, subjects };
  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));

  const overview = (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt hồ sơ</CardTitle>
            <CardDescription>Bức tranh đa chiều về học sinh — không phải kết luận cố định, có thể cập nhật bất cứ lúc nào.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileTextForm studentId={s.id} field="summary" value={s.profile?.summary ?? null} placeholder="Tóm tắt đặc điểm nổi bật, thế mạnh và nhu cầu hỗ trợ của học sinh…" />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {DIMENSION_ORDER.map((d) => (
            <Card key={d} className="p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{DIMENSION_LABEL[d]}</p>
                <Badge>{items[d].length}</Badge>
              </div>
              {items[d].length ? (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {items[d].slice(0, 3).map((i) => <li key={i.id} className="truncate">• {i.title}</li>)}
                  {items[d].length > 3 && <li className="text-xs">+{items[d].length - 3} mục khác</li>}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
              )}
            </Card>
          ))}
        </div>
      </div>
      <Card className="h-fit">
        <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Lớp</dt><dd><Link className="hover:underline" href={`/classes/${s.class.id}`}>{s.class.name}</Link> · {s.class.schoolYear}</dd>
            <dt className="text-muted-foreground">Mã HS</dt><dd>{s.studentCode ?? "—"}</dd>
            <dt className="text-muted-foreground">Ngày sinh</dt><dd>{s.dateOfBirth ? formatDate(s.dateOfBirth) : "—"}</dd>
            <dt className="text-muted-foreground">Giới tính</dt><dd>{s.gender ?? "—"}</dd>
            <dt className="text-muted-foreground">Phiên bản</dt><dd>v{s.profile?.version ?? 1}</dd>
            <dt className="text-muted-foreground">Cập nhật</dt><dd>{formatDate(s.profile?.updatedAt ?? s.updatedAt, true)}</dd>
            {s.notes && <><dt className="text-muted-foreground">Ghi chú</dt><dd className="whitespace-pre-line">{s.notes}</dd></>}
          </dl>
        </CardContent>
      </Card>
    </div>
  );

  const list = (d: ProfileDimension, extra?: { title?: string; description?: string }) => (
    <ProfileItemList {...listProps} dimension={d} items={items[d]} {...extra} />
  );

  const tabs: TabDef[] = [
    { value: "overview", label: "Tổng quan", content: overview },
    { value: "interests", label: "Sở thích", count: items.INTEREST.length,
      content: list("INTEREST", { description: "Lĩnh vực yêu thích, chủ đề quan tâm, hoạt động yêu thích, lĩnh vực muốn khám phá." }) },
    { value: "strengths", label: "Thế mạnh", count: items.STRENGTH.length,
      content: list("STRENGTH", { description: "Thế mạnh và năng khiếu — nhận diện độc lập với điểm số." }) },
    { value: "competency", label: "Năng lực", count: items.COMPETENCY.length,
      content: (
        <div className="space-y-6">
          {list("COMPETENCY", { title: "Năng lực học tập thể hiện qua minh chứng", description: "Mô tả định tính biểu hiện năng lực, không gắn nhãn xếp loại." })}
          <AcademicResultsPanel studentId={s.id} results={s.academicResults} subjects={subjects} />
        </div>
      ) },
    { value: "needs", label: "Nhu cầu hỗ trợ", count: items.LEARNING_NEED.length + items.LEARNING_PREFERENCE.length,
      content: (
        <div className="grid gap-6 xl:grid-cols-2">
          {list("LEARNING_NEED", { description: "Khó khăn và hình thức hỗ trợ phù hợp. Không hạ thấp mục tiêu học tập." })}
          {list("LEARNING_PREFERENCE", { description: "Một học sinh có thể có nhiều cách học phù hợp." })}
        </div>
      ) },
    { value: "goals", label: "Định hướng phát triển", count: items.DEVELOPMENT_GOAL.length,
      content: list("DEVELOPMENT_GOAL", { description: "Lĩnh vực muốn phát triển, kỹ năng muốn cải thiện, hoạt động muốn thử sức, mục tiêu tương lai." }) },
    { value: "evidence", label: "Minh chứng", count: s.evidenceLinks.length,
      content: s.evidenceLinks.length ? (
        <Card>
          <CardContent className="pt-5">
            <ul className="divide-y">
              {s.evidenceLinks.map(({ evidence: e }) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                  <span className="flex-1 font-medium">{e.title}</span>
                  <Badge>{EVIDENCE_TYPE_LABEL[e.type]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(e.collectedAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={FolderOpen} title="Chưa có minh chứng"
          description="Chức năng tải bảng điểm, bài kiểm tra, sản phẩm và hình ảnh minh chứng sẽ được triển khai ở Sprint 3."
          action={<Button asChild variant="outline" size="sm"><Link href="/data-intake"><Upload /> Tiếp nhận dữ liệu</Link></Button>} />
      ) },
    { value: "comments", label: "Nhận xét", count: s.observations.length,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Nhận xét chung của giáo viên</CardTitle></CardHeader>
            <CardContent>
              <ProfileTextForm studentId={s.id} field="teacherComment" value={s.profile?.teacherComment ?? null} placeholder="Nhận xét tổng quát về học sinh…" />
            </CardContent>
          </Card>
          <ObservationsPanel studentId={s.id} observations={s.observations} subjects={subjects} />
        </div>
      ) },
    { value: "history", label: "Lịch sử cập nhật", count: history.length,
      content: history.length ? (
        <Card>
          <CardContent className="pt-5">
            <ol className="relative space-y-4 border-l pl-5">
              {history.map((h) => {
                const meta = (h.metadata ?? {}) as { dimension?: ProfileDimension; title?: string; profileStatus?: string };
                return (
                  <li key={h.id} className="text-sm">
                    <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-card bg-primary" />
                    <p className="font-medium">
                      {AUDIT_ACTION_LABEL[h.action] ?? h.action}
                      {meta.dimension && <span className="font-normal text-muted-foreground"> · {DIMENSION_LABEL[meta.dimension]}</span>}
                    </p>
                    {meta.title && <p className="text-muted-foreground">“{meta.title}”</p>}
                    <p className="text-xs text-muted-foreground">{h.user?.fullName ?? "Hệ thống"} · {formatDate(h.createdAt, true)}</p>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={History} title="Chưa có lịch sử" description="Mọi thay đổi trên hồ sơ sẽ được ghi lại tại đây." />
      ) },
  ];

  return (
    <>
      <Link href={`/classes/${s.class.id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Lớp {s.class.name}
      </Link>
      <PageHeader
        title={s.fullName}
        description={`Lớp ${s.class.name} · ${s.class.schoolYear}${s.studentCode ? ` · ${s.studentCode}` : ""}`}
        actions={
          <>
            <ProfileStatusControl studentId={s.id} status={s.profileStatus} />
            <EditStudentButton classes={classOptions} student={{ id: s.id, classId: s.classId, fullName: s.fullName, studentCode: s.studentCode, dateOfBirth: s.dateOfBirth, gender: s.gender, notes: s.notes }} />
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <ProfileStatusBadge status={s.profileStatus} />
        {s.isSample && <SampleBadge />}
      </div>
      <ProfileTabs tabs={tabs} initial={tab ?? "overview"} />
    </>
  );
}
