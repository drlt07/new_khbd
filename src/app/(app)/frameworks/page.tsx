import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireTeacher } from "@/lib/auth/session";
import { listFrameworks } from "@/server/services/framework.service";
import { listSubjectsForTeacher } from "@/server/services/subject.service";
import { PageHeader } from "@/components/layout/page-header";
import { CreateFrameworkButton } from "@/components/frameworks/create-framework-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DIMENSION_LABEL } from "@/lib/labels";
import { DIMENSION_ORDER } from "@/config/default-framework";

export const metadata: Metadata = { title: "Khung thông tin" };

export default async function FrameworksPage() {
  const session = await requireTeacher();
  const [frameworks, subjects] = await Promise.all([listFrameworks(session.teacherId), listSubjectsForTeacher(session.teacherId)]);
  return (
    <>
      <PageHeader
        title="Khung thông tin và đánh giá"
        description="Xác định những phương diện cần theo dõi ở học sinh. Tùy chỉnh, bổ sung hoặc ẩn tiêu chí phù hợp với môn học."
        actions={<CreateFrameworkButton subjects={subjects} />}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {frameworks.map((fw) => (
          <Link key={fw.id} href={`/frameworks/${fw.id}`} className="group">
            <Card className="h-full p-5 transition-colors group-hover:border-primary/40">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{fw.name}</p>
                  {fw.description && <p className="line-clamp-2 text-sm text-muted-foreground">{fw.description}</p>}
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {fw.isDefault && <Badge tone="primary">Mặc định</Badge>}
                <Badge>{fw.subject?.name ?? "Mọi môn học"}</Badge>
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {DIMENSION_ORDER.map((d) => (
                  <li key={d} className="flex justify-between gap-2">
                    <span className="truncate">{DIMENSION_LABEL[d]}</span>
                    <span className="tabular-nums">{fw.criteria.filter((c) => c.dimension === d && c.isActive).length}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
