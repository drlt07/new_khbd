"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, GitBranchPlus, History, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation } from "@/hooks/use-mutation";

type Version = { id: string; version: number; status: "DRAFT" | "CONFIRMED" | "SUPERSEDED"; _count: { lessonPlans: number } };
const ST = { DRAFT: "bản nháp", CONFIRMED: "đã duyệt", SUPERSEDED: "phiên bản cũ" };

export function SessionActions({ id, status, versions, lessonCount }: { id: string; status: Version["status"]; versions: Version[]; lessonCount: number }) {
  const router = useRouter();
  const nv = useMutation();
  const del = useMutation();
  async function newVersion() {
    const r = await nv.mutate<{ id: string }>(`/api/sessions/${id}/version`, "POST", undefined, { refresh: false });
    if (r.ok) { router.push(`/phase1/${r.data.id}?step=4`); router.refresh(); }
  }
  return (
    <>
      {status !== "DRAFT" && (
        <Button variant="secondary" onClick={newVersion} disabled={nv.pending} title="Chỉnh sửa thành viên hoặc tiêu chí: hệ thống giữ phiên bản này và tạo phiên bản mới">
          {nv.pending ? <Loader2 className="animate-spin" /> : <GitBranchPlus />} Tạo phiên bản mới để chỉnh sửa
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline"><History /> Phiên bản ({versions.length}) <ChevronDown /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Lịch sử phiên bản</DropdownMenuLabel>
          {versions.map((v) => (
            <DropdownMenuItem key={v.id} asChild>
              <Link href={`/phase1/${v.id}`} className={v.id === id ? "font-semibold" : ""}>v{v.version} — {ST[v.status]}{v._count.lessonPlans ? ` · ${v._count.lessonPlans} KHBD` : ""}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><a href={`/api/sessions/${id}/export`} download><Download /> Xuất Excel hồ sơ nhóm</a></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmButton variant="ghost" size="icon" className="text-danger" aria-label="Xóa phiên" title="Xóa phiên phân nhóm này?" confirmLabel="Xóa"
        description={lessonCount ? `${lessonCount} KHBD đang dùng phiên này cũng sẽ bị xóa. Không thể hoàn tác.` : "Không thể hoàn tác."}
        onConfirm={async () => { const r = await del.mutate(`/api/sessions/${id}`, "DELETE", undefined, { refresh: false }); if (r.ok) { router.push("/phase1"); router.refresh(); } return r; }}>
        <Trash2 />
      </ConfirmButton>
    </>
  );
}
