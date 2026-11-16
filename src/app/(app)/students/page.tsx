import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth/session";
import { studentFilterSchema } from "@/schemas/student";
import { listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { PageHeader } from "@/components/layout/page-header";
import { UrlFilters } from "@/components/layout/url-filters";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentTable } from "@/components/students/student-table";
import { toStudentRows } from "@/components/students/to-student-rows";
import { Card } from "@/components/ui/card";
import { PROFILE_STATUS_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "Học sinh" };

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const session = await requireTeacher();
  const filter = studentFilterSchema.parse(await searchParams);
  const [students, classes] = await Promise.all([listStudents(session.teacherId, filter), listClasses(session.teacherId)]);
  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));
  const hasFilter = Boolean(filter.q || filter.classId || filter.status);

  return (
    <>
      <PageHeader
        title="Học sinh"
        description={`${students.length} học sinh${hasFilter ? " phù hợp bộ lọc" : " trong các lớp đang hoạt động"}.`}
        actions={<StudentToolbar classes={classOptions} defaultClassId={filter.classId} />}
      />
      <Card className="p-4">
        <UrlFilters
          filters={[
            { type: "search", name: "q", placeholder: "Tìm theo tên hoặc mã học sinh" },
            { type: "select", name: "classId", label: "Lớp", options: classOptions.map((c) => ({ value: c.id, label: `${c.name} (${c.schoolYear})` })) },
            { type: "select", name: "status", label: "Hồ sơ", options: Object.entries(PROFILE_STATUS_LABEL).map(([value, label]) => ({ value, label })) },
          ]}
        />
        <div className="mt-4">
          <StudentTable
            students={toStudentRows(students)}
            classes={classOptions}
            emptyHint={classes.length === 0 ? "Hãy tạo lớp học trước, sau đó thêm học sinh." : hasFilter ? "Không có học sinh phù hợp bộ lọc." : undefined}
          />
        </div>
      </Card>
    </>
  );
}
