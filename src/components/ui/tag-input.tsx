"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

/** Nhập nhiều giá trị ngắn dạng thẻ: Enter hoặc dấu phẩy để thêm. */
export function TagInput({
  id, value, onChange, suggestions = [], placeholder, tone = "primary",
}: { id: string; value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; placeholder?: string; tone?: "primary" | "success" | "warning" }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const next = [...value];
    for (const n of raw.split(",").map((s) => s.trim()).filter(Boolean)) if (!next.some((v) => v.toLowerCase() === n.toLowerCase())) next.push(n.slice(0, 60));
    onChange(next.slice(0, 15));
    setDraft("");
  };
  const tones = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning" };
  return (
    <div className="space-y-1.5">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <span key={v} className={cn("inline-flex items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-xs font-medium", tones[tone])}>
              {v}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== v))} aria-label={`Bỏ ${v}`} className="rounded-full p-0.5 hover:bg-black/5"><X className="size-3" /></button>
            </span>
          ))}
        </div>
      )}
      <Input
        id={id}
        list={`${id}-list`}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (draft.trim()) add(draft); } }}
        onBlur={() => draft.trim() && add(draft)}
      />
      <datalist id={`${id}-list`}>{suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}
