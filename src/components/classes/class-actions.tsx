"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { ClassFormDialog, type ClassFormValues } from "./class-form-dialog";

export function ClassActions({
  cls, subjectSuggestions, redirectAfterDelete,
}: { cls: ClassFormValues & { id: string; isArchived: boolean }; subjectSuggestions: string[]; redirectAfterDelete?: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "archive" | "delete">(null);
  const { mutate, pending, error, reset } = useMutation();

  async function run() {
    const res =
      confirm === "delete"
        ? await mutate(`/api/classes/${cls.id}`, "DELETE")
        : await mutate(`/api/classes/${cls.id}`, "PATCH", { isArchived: !cls.isArchived });
    if (res.ok) {
      setConfirm(null);
      if (confirm === "delete" && redirectAfterDelete) router.push(redirectAfterDelete);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Thao tác với lớp ${cls.name}`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}><Pencil /> Chỉnh sửa</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => { reset(); setConfirm("archive"); }}>
            {cls.isArchived ? <><ArchiveRestore /> Khôi phục</> : <><Archive /> Lưu trữ</>}
          </DropdownMenuItem>
          {cls.isArchived && (
            <DropdownMenuItem className="text-danger" onSelect={() => { reset(); setConfirm("delete"); }}>
              <Trash2 /> Xóa vĩnh viễn
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen && <ClassFormDialog open={editOpen} onOpenChange={setEditOpen} initial={cls} subjectSuggestions={subjectSuggestions} />}

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent
          title={confirm === "delete" ? `Xóa vĩnh viễn lớp ${cls.name}?` : cls.isArchived ? `Khôi phục lớp ${cls.name}?` : `Lưu trữ lớp ${cls.name}?`}
        >
          <p className="text-sm text-muted-foreground">
            {confirm === "delete"
              ? "Toàn bộ học sinh, hồ sơ, minh chứng và KHBD của lớp sẽ bị xóa. Thao tác này không thể hoàn tác."
              : cls.isArchived
                ? "Lớp sẽ hiển thị lại trong danh sách đang hoạt động."
                : "Lớp sẽ được ẩn khỏi danh sách và dashboard. Dữ liệu vẫn được giữ nguyên và có thể khôi phục."}
          </p>
          {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Hủy</Button>
            <Button variant={confirm === "delete" ? "destructive" : "default"} onClick={run} disabled={pending}>
              {confirm === "delete" ? "Xóa vĩnh viễn" : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
