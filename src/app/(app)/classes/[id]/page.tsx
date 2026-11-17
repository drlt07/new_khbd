import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getClassProgress } from "@/server/services/class.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tổng quan lớp" };

type Step = { title: string; detail: string; done: boolean; optional?: boolean; href: string; cta: string };

function StepList({ steps }: { steps: Step[] }) {
  const next = steps.findIndex((s) => !s.done && !s.optional);
  return (
    <ol className="divide-y">
      {steps.map((s, i) => (
        <li key={s.title} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
          <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            s.done ? "bg-success text-white" : i === next ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {s.done ? <Check className="size-3.5" /> : i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{s.title}{s.optional && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(không bắt buộc)</span>}</p>
            <p className="text-sm text-muted-foreground">{s.detail}</p>
          </div>
          <Button asChild size="sm" variant={i === next ? "default" : "outline"} className="shrink-0">
            <Link href={s.href}>{s.cta}{i === next && <ArrowRight />}</Link>
          </Button>
        </li>
      ))}
    </ol>
  );
}

export default async function ClassOverview({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const p = (await getClassProgress(session.userId, id))!;
  const base = `/classes/${id}`;

  const phase1: Step[] = [
    { title: "Danh sách học sinh & đặc trưng", detail: p.students ? `${p.students} học sinh · ${p.withTraits} em đã có sở thích / thế mạnh / nhu cầu hỗ trợ` : "Nhập danh sách lớp từ Excel, kèm sở thích, thế mạnh, cần hỗ trợ", done: p.students > 0 && p.withTraits > 0, href: `${base}/students`, cta: p.students ? "Xem / cập nhật" : "Nhập học sinh" },
    { title: "Tải bảng điểm", detail: p.sheets ? `Đã tải ${p.sheets} bảng điểm` : "Dùng khi nhóm có đặc trưng theo khoảng điểm (vnEdu, SMAS hoặc tự lập)", done: p.sheets > 0, optional: true, href: `${base}/scores`, cta: p.sheets ? "Xem bảng điểm" : "Tải bảng điểm" },
    { title: "Định nghĩa nhóm & xếp học sinh", detail: p.latestGrouping ? `Bộ nhóm gần nhất: ${p.latestGrouping.title} (${p.latestGrouping._count.groups} nhóm)` : "Đặt số nhóm và đặc trưng từng nhóm — hệ thống xếp học sinh, thầy cô chỉnh lại", done: p.groupings > 0, href: p.latestGrouping ? `${base}/groups/${p.latestGrouping.id}` : `${base}/groups/new`, cta: p.groupings ? "Mở bộ nhóm" : "Tạo bộ nhóm" },
  ];
  const phase2: Step[] = [
    { title: "Soạn KHBD theo nhóm", detail: p.latestLesson ? `KHBD gần nhất: ${p.latestLesson.title}` : "Mỗi hoạt động có nhiệm vụ riêng cho từng nhóm, theo đặc trưng nhóm ở Pha 1", done: p.lessons > 0, href: p.groupings ? `${base}/lessons/new` : `${base}/groups/new`, cta: p.groupings ? "Soạn KHBD mới" : "Cần chia nhóm trước" },
    { title: "Chỉnh sửa & xuất Word", detail: "Sửa nội dung, nhiệm vụ từng nhóm rồi tải file Word để nộp / in", done: false, optional: true, href: p.latestLesson ? `${base}/lessons/${p.latestLesson.id}` : `${base}/lessons`, cta: "Mở KHBD" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-info">Pha 1</p>
        <h2 className="mb-1 text-lg font-semibold">Dữ liệu học sinh → Chia nhóm</h2>
        <p className="mb-4 text-sm text-muted-foreground">Đẩy đặc trưng và điểm của học sinh lên, đặt các nhóm cố định theo đặc trưng thầy cô mong muốn.</p>
        <StepList steps={phase1} />
      </Card>
      <Card className={cn("p-5", !p.groupings && "opacity-70")}>
        <p className="text-xs font-semibold uppercase tracking-wide text-success">Pha 2</p>
        <h2 className="mb-1 text-lg font-semibold">Soạn KHBD cá thể hóa từ các nhóm</h2>
        <p className="mb-4 text-sm text-muted-foreground">{p.groupings ? "Chọn bộ nhóm đã chia, hệ thống gợi ý nhiệm vụ phù hợp cho từng nhóm trong mỗi hoạt động." : "Hoàn thành Pha 1 (có ít nhất một bộ nhóm) để bắt đầu soạn KHBD."}</p>
        <StepList steps={phase2} />
      </Card>
    </div>
  );
}
