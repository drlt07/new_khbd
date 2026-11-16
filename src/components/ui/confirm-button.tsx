"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "./button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "./dialog";
import { Alert } from "./alert";

/** Nút yêu cầu xác nhận trước khi thực hiện thao tác khó hoàn tác. */
export function ConfirmButton({
  title, description, confirmLabel = "Xác nhận", onConfirm, children, destructive = true, ...buttonProps
}: ButtonProps & {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    const res = await onConfirm();
    setPending(false);
    if (res.ok) setOpen(false);
    else setError(res.error ?? "Thao tác thất bại");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); setError(null); }}>
      <DialogTrigger asChild>
        <Button {...buttonProps}>{children}</Button>
      </DialogTrigger>
      <DialogContent title={title}>
        <p className="text-sm text-muted-foreground">{description}</p>
        {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>Hủy</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={run} disabled={pending}>
            {pending && <Loader2 className="animate-spin" />} {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
