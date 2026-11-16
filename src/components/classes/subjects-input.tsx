"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Nhập nhiều môn học dạng thẻ; gợi ý từ các môn đã có. Enter hoặc dấu phẩy để thêm. */
export function SubjectsInput({
  id, value, onChange, suggestions,
}: { id: string; value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const names = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const n of names) if (!next.some((v) => v.toLowerCase() === n.toLowerCase())) next.push(n);
    onChange(next);
    setDraft("");
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
              {s}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== s))} aria-label={`Bỏ môn ${s}`} className="rounded-full hover:bg-primary/10">
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        id={id}
        list={`${id}-list`}
        value={draft}
        placeholder="Nhập tên môn rồi nhấn Enter (ví dụ: Ngữ văn)"
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft.trim()) add(draft);
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
      />
      <datalist id={`${id}-list`}>
        {suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}
