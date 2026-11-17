import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type Item = {
  id: string; title: string; subject: string; periods: number; status: "DRAFT" | "DONE"; isSample: boolean; updatedAt: Date;
  grouping: { title: string; class: { id: string; name: string }; _count: { groups: number } };
};

export function LessonList({ items, showClass }: { items: Item[]; showClass?: boolean }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((l) => (
        <Link key={l.id} href={`/classes/${l.grouping.class.id}/lessons/${l.id}`} className="group">
          <Card className="h-full space-y-1.5 p-4 transition-colors group-hover:border-primary/40">
            <div className="flex items-start gap-2">
              <p className="flex-1 font-semibold">{l.title}</p>
              {l.isSample && <SampleBadge />}
              <Badge tone={l.status === "DONE" ? "success" : "neutral"}>{l.status === "DONE" ? "Hoàn thành" : "Bản nháp"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{[showClass && `Lớp ${l.grouping.class.name}`, l.subject, `${l.periods} tiết`].filter(Boolean).join(" · ")}</p>
            <p className="text-xs text-muted-foreground">Bộ nhóm: {l.grouping.title} ({l.grouping._count.groups} nhóm) · cập nhật {formatDate(l.updatedAt)}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
