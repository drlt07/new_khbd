import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { ApiError } from "@/lib/api";
import { getClassDetail, listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { listSubjectsForTeacher } from "@/server/services/subject.service";
import { PageHeader } from "@/components/layout/page-header";
import { ClassActions } from "@/components/classes/class-actions";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentTable } from "@/components/students/student-table";
import { toStudentRows } from "@/components/students/to-student-rows";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { ClipboardCheck, FolderOpen, Hourglass, Users } from "lucide-react";

export const metadata: Metadata = { title: "Chi tiết lớp" };

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireTeacher();
  const { id } = await params;
  const cls = await getClassDetail(session.teacherId, id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  });
  const [students, subjects, activeClasses] = await Promise.all([
    listStudents(session.teacherId, { classId: id }).then((list) => (cls.isArchived ? [] : list)),
    listSubjectsForTeacher(session.teacherId),
    listClasses(session.teacherId),
  ]);
  const rows = toStudentRows(students);
  const confirmed = students.filter((s) => s.profileStatus === "CONFIRMED").length;
  const pending = students.filter((s) => s.profileStatus === "PENDING_REVIEW").length;
  const classOptions = activeClasses.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));

  return (
    <>
      <Link href="/classes" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" /> Danh sách lớp
      </Link>
      <PageHeader
        title={`Lớp ${cls.name}`}
        description={[`Năm học ${cls.schoolYear}`, cls.gradeLevel ? `Khối ${cls.gradeLevel}` : null, cls.description].filter(Boolean).join(" · ")}
        actions={
          <>
            {!cls.isArchived && <StudentToolbar classes={classOptions} defaultClassId={cls.id} />}
            <ClassActions
              redirectAfterDelete="/classes"
              subjectSuggestions={subjects.map((s) => s.name)}
              cls={{ id: cls.id, name: cls.name, schoolYear: cls.schoolYear, gradeLevel: cls.gradeLevel, description: cls.description, isArchived: cls.isArchived, subjects: cls.subjects.map((s) => s.name) }}
            />
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {cls.isSample && <SampleBadge />}
        {cls.subjects.map((s) => <Badge key={s.id} tone="primary">{s.name}</Badge>)}
      </div>
      {cls.isArchived && <Alert tone="warning" className="mb-4">Lớp đã được lưu trữ. Khôi phục lớp để xem và chỉnh sửa học sinh.</Alert>}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Học sinh" value={cls._count.students} icon={Users} accent="info" />
        <StatCard label="Hồ sơ đã xác nhận" value={confirmed} icon={ClipboardCheck} accent="success" />
        <StatCard label="Chờ xác nhận" value={pending} icon={Hourglass} accent="warning" />
        <StatCard label="Minh chứng" value={cls._count.evidences} icon={FolderOpen} />
      </div>

      <Card>
        <CardHeader><CardTitle>Danh sách học sinh</CardTitle></CardHeader>
        <CardContent>
          <StudentTable students={rows} classes={classOptions} showClass={false} />
        </CardContent>
      </Card>
    </>
  );
}
