import { Badge } from "@/components/ui/badge";

export function SessionStatus({ status, version }: { status: "DRAFT" | "CONFIRMED" | "SUPERSEDED"; version?: number }) {
  const v = version ? `v${version} · ` : "";
  if (status === "CONFIRMED") return <Badge tone="success">{v}Đã duyệt</Badge>;
  if (status === "SUPERSEDED") return <Badge tone="neutral">{v}Phiên bản cũ</Badge>;
  return <Badge tone="warning">{v}Bản nháp</Badge>;
}

export function LessonStatus({ status, outdated }: { status: "DRAFT" | "REVIEW" | "DONE"; outdated?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {status === "DONE" ? <Badge tone="success">Hoàn thành</Badge> : status === "REVIEW" ? <Badge tone="info">Chờ duyệt</Badge> : <Badge>Bản nháp</Badge>}
      {outdated && <Badge tone="danger" title="Hồ sơ nhóm đã có phiên bản mới">Cần cập nhật nhóm</Badge>}
    </span>
  );
}

export function MiniSteps({ step, total, labels }: { step: number; total: number; labels?: string[] }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Bước ${step}/${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} title={labels?.[i]} className={`h-1.5 w-6 rounded-full ${i < step - 1 ? "bg-success" : i === step - 1 ? "bg-primary" : "bg-slate-200"}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{labels?.[step - 1] ?? `Bước ${step}/${total}`}</span>
    </div>
  );
}

const fmt = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
export function timeAgo(d: Date) {
  const s = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 60) return "vừa xong";
  if (abs < 3600) return fmt.format(Math.round(s / 60), "minute");
  if (abs < 86400) return fmt.format(Math.round(s / 3600), "hour");
  return fmt.format(Math.round(s / 86400), "day");
}
