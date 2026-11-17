import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { toStudentRows, traitSuggestions } from "@/server/services/views";
import { PageHeader } from "@/components/layout/page-header";
import { UrlFilters } from "@/components/layout/url-filters";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentTable } from "@/components/students/student-table";
import { TraitLegend } from "@/components/students/trait-chips";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Học sinh" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; classId?: string }> }) {
  const session = await requireUser();
  const { q, classId } = await searchParams;
  const [students, classes, suggestions] = await Promise.all([
    listStudents(session.userId, { q, classId }),
    listClasses(session.userId),
    traitSuggestions(session.userId),
  ]);
  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));
  return (
    <>
      <PageHeader title="Học sinh" description={`${students.length} học sinh`} actions={<StudentToolbar classes={classOptions} defaultClassId={classId} suggestions={suggestions} />} />
      <Card className="space-y-3 p-4">
        <UrlFilters filters={[
          { type: "search", name: "q", placeholder: "Tìm theo tên hoặc mã" },
          { type: "select", name: "classId", label: "Lớp", options: classOptions.map((c) => ({ value: c.id, label: `${c.name} (${c.schoolYear})` })) },
        ]} />
        <TraitLegend />
        <StudentTable students={toStudentRows(students)} classes={classOptions} suggestions={suggestions}
          emptyHint={classes.length ? (q || classId ? "Không có học sinh phù hợp." : undefined) : "Hãy tạo lớp học trước."} />
      </Card>
    </>
  );
}
