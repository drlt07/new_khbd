import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Shuffle } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { listClasses } from "@/server/services/class.service";
import { listStudents } from "@/server/services/student.service";
import { toStudentRows, traitSuggestions } from "@/server/services/views";
import { PageHeader } from "@/components/layout/page-header";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { DeleteClassButton } from "@/components/classes/class-actions";
import { StudentToolbar } from "@/components/students/student-toolbar";
import { StudentTable } from "@/components/students/student-table";
import { TraitLegend } from "@/components/students/trait-chips";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Lớp học" };

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const cls = await prisma.class.findFirst({ where: { id, ownerId: session.userId } });
  if (!cls) notFound();
  const [students, classes, suggestions] = await Promise.all([
    listStudents(session.userId, { classId: id }),
    listClasses(session.userId),
    traitSuggestions(session.userId),
  ]);
  const classOptions = classes.map((c) => ({ id: c.id, name: c.name, schoolYear: c.schoolYear }));
  const missing = students.filter((s) => !s.traits.length).length;

  return (
    <>
      <Link href="/classes" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" /> Lớp học</Link>
      <PageHeader
        title={`Lớp ${cls.name}`}
        description={`Năm học ${cls.schoolYear} · ${students.length} học sinh${missing ? ` · ${missing} học sinh chưa có thông tin` : ""}`}
        actions={
          <>
            <StudentToolbar classes={classOptions} defaultClassId={cls.id} suggestions={suggestions} />
            <ClassFormButton initial={{ id: cls.id, name: cls.name, schoolYear: cls.schoolYear }} />
            <DeleteClassButton id={cls.id} name={cls.name} />
            <Button asChild disabled={students.length < 2}><Link href={`/groups/new?classId=${cls.id}`}><Shuffle /> Chia nhóm lớp này</Link></Button>
          </>
        }
      />
      <Card>
        <CardContent className="space-y-3 pt-5">
          <TraitLegend />
          <StudentTable students={toStudentRows(students)} classes={classOptions} suggestions={suggestions} showClass={false} />
        </CardContent>
      </Card>
    </>
  );
}
