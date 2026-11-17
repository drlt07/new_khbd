"use client";
import { useRouter } from "next/navigation";
import { Download, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { useMutation } from "@/hooks/use-mutation";

export function EvidenceActions({ id, hasFile, title }: { id: string; hasFile: boolean; title: string }) {
  const router = useRouter();
  const extract = useMutation();
  const del = useMutation();
  return (
    <>
      {hasFile && (
        <Button asChild variant="outline"><a href={`/api/evidence/${id}/file?download=1`} download><Download /> Tải về</a></Button>
      )}
      <Button variant="outline" disabled={extract.pending} onClick={() => extract.mutate(`/api/evidence/${id}/extract`, "POST")}>
        {extract.pending ? <Loader2 className="animate-spin" /> : <RefreshCw />} Trích xuất lại
      </Button>
      <ConfirmButton
        variant="outline"
        className="text-danger"
        title="Xóa minh chứng?"
        description={`“${title}” và tệp đính kèm sẽ bị xóa; liên kết với học sinh và tiêu chí cũng bị gỡ. Thao tác không thể hoàn tác.`}
        confirmLabel="Xóa minh chứng"
        onConfirm={async () => {
          const r = await del.mutate(`/api/evidence/${id}`, "DELETE", undefined, { refresh: false });
          if (r.ok) router.push("/evidence");
          return r;
        }}
      >
        <Trash2 /> Xóa
      </ConfirmButton>
      {extract.error && <p className="w-full text-right text-xs text-danger">{extract.error}</p>}
    </>
  );
}
