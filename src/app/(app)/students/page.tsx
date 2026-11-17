import type { Metadata } from "next";
import Link from "next/link";
import { Library, Sheet } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { listScoreSheets } from "@/server/services/score.service";
import { toStudentRows, traitSuggestions } from "@/server/services/views";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentTable } from "@/components/students/student-table";
import { TraitLegend } from "@/components/students/trait-chips";
import { ScoreUpload } from "@/components/scores/score-upload";
import { ScoreSheets } from "@/components/scores/score-sheets";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dữ liệu học sinh" };

export default async function StudentsDataPage({ searchParams }: { searchParams: Promise<{ classId?: string; tab?: string }> }) {
  const session = await requireUser();
  const { classId: wanted, tab = "list" } = await searchParams;
  const classes = await listClasses(session.userId);
  if (!classes.length)
    return <PageContainer><PageHeader title="Dữ liệu học sinh" /><EmptyState icon={Library} title="Chưa có lớp học" description="Tạo lớp trước khi nhập dữ liệu học sinh." action={<ClassFormButton />} /></PageContainer>;
  const cls = classes.find((c) => c.id === wanted) ?? classes[0];
  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));
  const [students, suggestions, sheets] = await Promise.all([
    listStudents(session.userId, { classId: cls.id }), traitSuggestions(session.userId),
    tab === "scores" ? listScoreSheets(session.userId, cls.id) : Promise.resolve([]),
  ]);
  const simple = tab === "scores" ? await prisma.student.findMany({ where: { classId: cls.id }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }) : [];
  const href = (p: Record<string, string>) => `/students?${new URLSearchParams({ classId: cls.id, tab, ...p })}`;
  return (
    <PageContainer>
      <PageHeader title="Dữ liệu học sinh" description="Danh sách, điểm số và đặc trưng (sở thích, thế mạnh, nhu cầu hỗ trợ) — đầu vào của Pha 1." />
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Chọn lớp">
        {classes.map((c) => (
          <Link key={c.id} role="tab" aria-selected={c.id === cls.id} href={href({ classId: c.id })}
            className={cn("rounded-full border px-3 py-1 text-sm", c.id === cls.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40")}>
            Lớp {c.name} <span className="opacity-70">· {c._count.students}</span>
          </Link>
        ))}
      </div>
      <div className="mb-4 flex flex-col gap-3 border-b sm:flex-row sm:items-end sm:justify-between">
        <nav className="flex gap-1" aria-label="Loại dữ liệu">
          {[["list", "Danh sách & đặc trưng"], ["scores", "Bảng điểm"]].map(([k, l]) => (
            <Link key={k} href={href({ tab: k })} aria-current={tab === k ? "page" : undefined}
              className={cn("border-b-2 px-3 py-2 text-sm", tab === k ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>{l}</Link>
          ))}
        </nav>
        {tab === "list" && <div className="flex flex-wrap gap-2 pb-2"><StudentToolbar classes={classOptions} defaultClassId={cls.id} suggestions={suggestions} /></div>}
      </div>
      {tab === "list" ? (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <TraitLegend />
            <StudentTable students={toStudentRows(students)} classes={classOptions} suggestions={suggestions} showClass={false}
              emptyHint="Nhập danh sách từ Excel (cột Họ và tên, Sở thích, Thế mạnh, Cần hỗ trợ). Nhập lại tệp sẽ cập nhật đặc trưng, không nhân đôi học sinh." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <ScoreUpload classId={cls.id} studentCount={simple.length} />
          {sheets.length ? <ScoreSheets sheets={sheets} students={simple} /> : <EmptyState icon={Sheet} title="Chưa có bảng điểm" description="Bảng điểm giúp AI xếp học sinh theo mức năng lực mà thầy cô mô tả cho từng nhóm." />}
        </div>
      )}
    </PageContainer>
  );
}
