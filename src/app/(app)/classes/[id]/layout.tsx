import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getClassProgress } from "@/server/services/class.service";
import { ClassTabs } from "@/components/class-workspace/class-tabs";
import { ClassFormButton } from "@/components/classes/class-form-dialog";
import { DeleteClassButton } from "@/components/classes/class-actions";
import { SampleBadge } from "@/components/ui/badge";

export default async function ClassLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const p = await getClassProgress(session.userId, id);
  if (!p) notFound();
  return (
    <>
      <Link href="/classes" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden"><ChevronLeft className="size-4" /> Tất cả lớp học</Link>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">Lớp {p.cls.name} {p.cls.isSample && <SampleBadge />}</h1>
          <p className="text-sm text-muted-foreground">Năm học {p.cls.schoolYear} · {p.students} học sinh</p>
        </div>
        <div className="flex gap-2">
          <ClassFormButton initial={{ id: p.cls.id, name: p.cls.name, schoolYear: p.cls.schoolYear }} />
          <DeleteClassButton id={p.cls.id} name={p.cls.name} />
        </div>
      </div>
      <ClassTabs classId={id} counts={{ students: p.students, scores: p.sheets, groups: p.groupings, lessons: p.lessons }} />
      {children}
    </>
  );
}
