"use client";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";

export function DocumentRowActions({ id, title }: { id: string; title: string }) {
  const re = useMutation();
  const del = useMutation();
  return (
    <div className="flex justify-end gap-1">
      <Button size="icon" variant="ghost" disabled={re.pending} onClick={() => re.mutate(`/api/training/documents/${id}/reprocess`, "POST")}
        aria-label={`Xử lý lại ${title}`} title="Trích xuất & đánh chỉ mục lại">
        {re.pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      </Button>
      <ConfirmButton size="icon" variant="ghost" className="text-danger" aria-label={`Xóa ${title}`}
        title="Xóa tài liệu?" description={`“${title}” và các đoạn đã đánh chỉ mục sẽ bị xóa khỏi kho.`} confirmLabel="Xóa"
        onConfirm={() => del.mutate(`/api/training/documents/${id}`, "DELETE")}>
        <Trash2 />
      </ConfirmButton>
    </div>
  );
}
