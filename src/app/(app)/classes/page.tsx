import type { Metadata } from "next";
import Link from "next/link";
import { Library } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { classFilterSchema } from "@/schemas/class";
import { listClasses, listSchoolYears } from "@/server/services/class.service";
import { listSubjectsForTeacher } from "@/server/services/subject.service";
import { PageHeader } from "@/components/layout/page-header";
import { UrlFilters } from "@/components/layout/url-filters";
import { CreateClassButton } from "@/components/classes/create-class-button";
import { ClassActions } from "@/components/classes/class-actions";
import { Card } from "@/components/ui/card";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata: Metadata = { title: "Lớp học" };

export default async function ClassesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const session = await requireTeacher();
  const filter = classFilterSchema.parse(await searchParams);
  const [classes, years, subjects] = await Promise.all([
    listClasses(session.teacherId, filter),
    listSchoolYears(session.teacherId),
    listSubjectsForTeacher(session.teacherId),
  ]);
  const subjectNames = subjects.map((s) => s.name);
  const hasFilter = Boolean(filter.q || filter.year || filter.subjectId);

  return (
    <>
      <PageHeader
        title="Lớp học"
        description="Quản lý lớp, năm học, môn học và tiến độ hồ sơ học sinh."
        actions={<CreateClassButton subjectSuggestions={subjectNames} />}
      />
      <Card className="p-4">
        <UrlFilters
          filters={[
            { type: "search", name: "q", placeholder: "Tìm theo tên lớp" },
            { type: "select", name: "year", label: "Năm học", options: years.map((y) => ({ value: y, label: y })) },
            { type: "select", name: "subjectId", label: "Môn học", options: subjects.map((s) => ({ value: s.id, label: s.name })) },
            { type: "select", name: "archived", label: "Trạng thái", options: [{ value: "1", label: "Đã lưu trữ" }] },
          ]}
        />
        <div className="mt-4">
          {classes.length === 0 ? (
            <EmptyState
              icon={Library}
              title={hasFilter ? "Không có lớp phù hợp bộ lọc" : filter.archived === "1" ? "Không có lớp đã lưu trữ" : "Chưa có lớp học"}
              description={hasFilter ? "Thử thay đổi từ khóa hoặc bộ lọc." : "Tạo lớp học đầu tiên để bắt đầu quản lý học sinh và hồ sơ."}
              action={!hasFilter && filter.archived !== "1" ? <CreateClassButton subjectSuggestions={subjectNames} /> : undefined}
            />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Lớp</TH>
                  <TH>Năm học</TH>
                  <TH className="hidden md:table-cell">Môn học</TH>
                  <TH>Học sinh</TH>
                  <TH className="min-w-44">Hồ sơ đã xác nhận</TH>
                  <TH className="hidden lg:table-cell">KHBD</TH>
                  <TH className="w-12"><span className="sr-only">Thao tác</span></TH>
                </tr>
              </THead>
              <TBody>
                {classes.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link href={`/classes/${c.id}`} className="font-medium hover:text-primary hover:underline">Lớp {c.name}</Link>
                      <div className="mt-0.5 flex gap-1">
                        {c.isSample && <SampleBadge />}
                        {c.isArchived && <Badge>Đã lưu trữ</Badge>}
                      </div>
                    </TD>
                    <TD className="text-muted-foreground">{c.schoolYear}</TD>
                    <TD className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.subjects.length ? c.subjects.map((s) => <Badge key={s.id} tone="primary">{s.name}</Badge>) : <span className="text-muted-foreground">—</span>}
                      </div>
                    </TD>
                    <TD className="tabular-nums">{c.studentCount}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Progress value={c.progress} className="w-24" label={`Tiến độ hồ sơ lớp ${c.name}`} />
                        <span className="text-xs tabular-nums text-muted-foreground">{c.confirmedCount}/{c.studentCount}</span>
                      </div>
                      {c.pendingCount > 0 && <p className="mt-0.5 text-xs text-warning">{c.pendingCount} chờ xác nhận</p>}
                    </TD>
                    <TD className="hidden tabular-nums lg:table-cell">{c._count.lessonPlans}</TD>
                    <TD>
                      <ClassActions
                        subjectSuggestions={subjectNames}
                        cls={{ id: c.id, name: c.name, schoolYear: c.schoolYear, gradeLevel: c.gradeLevel, description: c.description, isArchived: c.isArchived, subjects: c.subjects.map((s) => s.name) }}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </Card>
    </>
  );
}
