"use client";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Ô soạn thảo tự giãn chiều cao, phong cách tài liệu (viền chỉ hiện khi hover/focus) */
export function DocField({ label, value, onChange, placeholder, className, minRows = 1, readOnly }: {
  label?: string; value: string | null; onChange: (v: string) => void; placeholder?: string; className?: string; minRows?: number; readOnly?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>}
      <textarea ref={ref} rows={minRows} value={value ?? ""} placeholder={placeholder} readOnly={readOnly} onChange={(e) => onChange(e.target.value)}
        className="block w-full resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1 text-[14.5px] leading-relaxed placeholder:italic placeholder:text-slate-400 hover:border-slate-200 focus:border-primary/40 focus:bg-white focus:outline-none" />
    </label>
  );
}
