import type { Metadata } from "next";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { studentFilterSchema } from "@/schemas/student";
import { listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { PageHeader } from "@/components/layout/page-header";
import { UrlFilters } from "@/components/layout/url-filters";
import { ProfileStatusBadge } from "@/components/students/profile-status-badge";
import { Card } from "@/components/ui/card";
import { SampleBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PROFILE_STATUS_LABEL } from "@/lib/labels";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Hồ sơ học sinh" };

export default async function ProfilesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const session = await requireTeacher();
  const filter = studentFilterSchema.parse(await searchParams);
  const [students, classes] = await Promise.all([listStudents(session.teacherId, filter), listClasses(session.teacherId)]);

  return (
    <>
      <PageHeader title="Hồ sơ học sinh" description="Mỗi hồ sơ gồm sở thích, thế mạnh, năng lực, nhu cầu hỗ trợ, cách học và định hướng phát triển." />
      <div className="mb-4">
        <UrlFilters
          filters={[
            { type: "search", name: "q", placeholder: "Tìm học sinh" },
            { type: "select", name: "classId", label: "Lớp", options: classes.map((c) => ({ value: c.id, label: `${c.name} (${c.schoolYear})` })) },
            { type: "select", name: "status", label: "Trạng thái", options: Object.entries(PROFILE_STATUS_LABEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
      </div>
      {students.length === 0 ? (
        <EmptyState icon={UserRound} title="Không có hồ sơ phù hợp" description="Thêm học sinh vào lớp để bắt đầu xây dựng hồ sơ." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => {
            const total = s._count.interests + s._count.strengths + s._count.learningNeeds;
            return (
              <Link key={s.id} href={`/profiles/${s.id}`} className="group">
                <Card className="flex h-full gap-3 p-4 transition-colors group-hover:border-primary/40">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{initials(s.fullName)}</span>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="truncate font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">Lớp {s.class.name} · {total} mục hồ sơ · {s._count.observations} nhận xét</p>
                    <div className="flex flex-wrap gap-1"><ProfileStatusBadge status={s.profileStatus} />{s.isSample && <SampleBadge />}</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
