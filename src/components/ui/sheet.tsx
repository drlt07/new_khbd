"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetTitle = Dialog.Title;

export function SheetContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/40" />
      <Dialog.Content
        className={cn("fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r bg-card shadow-xl focus:outline-none", className)}
        {...props}
      >
        {children}
        <Dialog.Close className="absolute right-3 top-3 rounded-md p-1 hover:bg-muted" aria-label="Đóng">
          <X className="size-4" />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
