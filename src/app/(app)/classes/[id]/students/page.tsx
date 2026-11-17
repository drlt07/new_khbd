import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { toStudentRows, traitSuggestions } from "@/server/services/views";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentTable } from "@/components/students/student-table";
import { TraitLegend } from "@/components/students/trait-chips";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Học sinh & đặc trưng" };

export default async function ClassStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const [students, classes, suggestions] = await Promise.all([listStudents(session.userId, { classId: id }), listClasses(session.userId), traitSuggestions(session.userId)]);
  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));
  const missing = students.filter((s) => !s.traits.length).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Bước 1 của Pha 1. Nhập lại tệp Excel bất cứ lúc nào — học sinh đã có sẽ được <b>cập nhật đặc trưng</b>, không bị nhân đôi.</p>
        <div className="flex flex-wrap gap-2"><StudentToolbar classes={classOptions} defaultClassId={id} suggestions={suggestions} /></div>
      </div>
      {missing > 0 && students.length > 0 && <Alert tone="warning">{missing} học sinh chưa có đặc trưng — các em sẽ được xếp nhóm để cân bằng sĩ số và ghi rõ “chưa đủ dữ liệu”.</Alert>}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <TraitLegend />
          <StudentTable students={toStudentRows(students)} classes={classOptions} suggestions={suggestions} showClass={false} emptyHint="Nhập danh sách lớp từ Excel (có cột Sở thích, Thế mạnh, Cần hỗ trợ) hoặc thêm từng học sinh." />
        </CardContent>
      </Card>
      {students.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline"><Link href={`/classes/${id}/scores`}>Tiếp: Bảng điểm</Link></Button>
          <Button asChild><Link href={`/classes/${id}/groups`}>Tiếp: Chia nhóm <ArrowRight /></Link></Button>
        </div>
      )}
    </div>
  );
}
