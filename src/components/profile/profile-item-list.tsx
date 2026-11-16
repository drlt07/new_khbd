"use client";
import { useState } from "react";
import { Bot, Paperclip, Pencil, Plus, Trash2, UserRoundCheck } from "lucide-react";
import type { ProfileDimension } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";
import { CONFIDENCE_LABEL, DIMENSION_LABEL, ORIGIN_LABEL, REVIEW_STATUS_LABEL } from "@/lib/labels";
import { cn, formatDate } from "@/lib/utils";
import { ProfileItemDialog } from "./profile-item-dialog";
import type { CriteriaOption, ProfileItemView, SubjectOption } from "./types";

const REVIEW_TONE = { PENDING: "warning", CONFIRMED: "success", EDITED: "success", REJECTED: "danger", NEEDS_DATA: "danger" } as const;

export function ProfileItemList({
  studentId, dimension, items, criteria, subjects, title, description, emptyText,
}: {
  studentId: string;
  dimension: ProfileDimension;
  items: ProfileItemView[];
  criteria: CriteriaOption[];
  subjects: SubjectOption[];
  title?: string;
  description?: string;
  emptyText?: string;
}) {
  const [dialog, setDialog] = useState<{ item?: ProfileItemView } | null>(null);
  const { mutate } = useMutation();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>{title ?? DIMENSION_LABEL[dimension]}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setDialog({})}><Plus /> Thêm</Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            {emptyText ?? "Chưa có thông tin. Hệ thống không tự suy đoán khi chưa có dữ liệu."}
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className={cn("rounded-lg border p-3", it.origin === "AI" && it.reviewStatus === "PENDING" && "border-warning/40 bg-warning-soft/30")}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">{it.title}</p>
                    {it.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{it.description}</p>}
                    {it.supportStrategy && <p className="text-sm"><span className="text-muted-foreground">Hỗ trợ: </span>{it.supportStrategy}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Badge tone={it.origin === "AI" ? "info" : "neutral"}>
                        {it.origin === "AI" ? <Bot className="size-3" /> : <UserRoundCheck className="size-3" />} {ORIGIN_LABEL[it.origin]}
                      </Badge>
                      <Badge tone={REVIEW_TONE[it.reviewStatus]}>{REVIEW_STATUS_LABEL[it.reviewStatus]}</Badge>
                      {it.confidence && <Badge>{CONFIDENCE_LABEL[it.confidence]}</Badge>}
                      {it.criteria && <Badge tone="primary">{it.criteria.name}</Badge>}
                      {it.subject && <Badge>{it.subject.name}</Badge>}
                      {it.evidences.length > 0 && (
                        <Badge title={it.evidences.map((e) => e.title).join(", ")}><Paperclip className="size-3" /> {it.evidences.length} minh chứng</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">Cập nhật {formatDate(it.updatedAt)}</span>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setDialog({ item: it })} aria-label={`Sửa ${it.title}`}><Pencil /></Button>
                  <ConfirmButton
                    size="icon"
                    variant="ghost"
                    className="text-danger"
                    aria-label={`Xóa ${it.title}`}
                    title="Xóa mục hồ sơ?"
                    description={`“${it.title}” sẽ bị xóa khỏi hồ sơ. Thao tác được ghi vào lịch sử cập nhật.`}
                    confirmLabel="Xóa"
                    onConfirm={() => mutate(`/api/profile-items/${dimension}/${it.id}`, "DELETE")}
                  >
                    <Trash2 />
                  </ConfirmButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {dialog && (
        <ProfileItemDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          studentId={studentId}
          dimension={dimension}
          item={dialog.item}
          criteria={criteria}
          subjects={subjects}
        />
      )}
    </Card>
  );
}
