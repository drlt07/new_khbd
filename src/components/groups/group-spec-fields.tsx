"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import type { GroupDraft } from "@/lib/grouping/presets";

export type SpecDraft = GroupDraft & { key: string; id?: string };

/** Các trường định nghĩa đặc trưng của một nhóm (dùng khi tạo và khi chỉnh bộ nhóm) */
export function GroupSpecFields({
  g, onChange, keywordSuggestions, hasScores, compact,
}: {
  g: SpecDraft;
  onChange: (patch: Partial<SpecDraft>) => void;
  keywordSuggestions: string[];
  hasScores: boolean;
  compact?: boolean;
}) {
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
  return (
    <div className="space-y-3">
      {!compact && (
        <div className="space-y-1">
          <label htmlFor={`${g.key}-name`} className="text-xs font-medium text-muted-foreground">Tên nhóm</label>
          <Input id={`${g.key}-name`} value={g.name} onChange={(e) => onChange({ name: e.target.value })} className="font-medium" />
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor={`${g.key}-profile`} className="text-xs font-medium text-muted-foreground">Đặc trưng nhóm (dùng để gợi ý nhiệm vụ ở Pha 2)</label>
        <Textarea id={`${g.key}-profile`} rows={2} className="min-h-0" value={g.profile} placeholder="Ví dụ: thích viết, tưởng tượng; hợp với nhiệm vụ sáng tác, nhập vai" onChange={(e) => onChange({ profile: e.target.value })} />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${g.key}-kw`} className="text-xs font-medium text-muted-foreground">Thế mạnh / sở thích phù hợp (để xếp học sinh)</label>
        <TagInput id={`${g.key}-kw`} value={g.keywords} onChange={(keywords) => onChange({ keywords })} suggestions={keywordSuggestions} placeholder="Gõ rồi Enter, ví dụ: Thuyết trình" tone="success" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Khoảng điểm{!hasScores && " (cần bảng điểm)"}</span>
          <div className="flex items-center gap-1.5">
            <Input aria-label="Điểm từ" inputMode="decimal" placeholder="từ" className="h-8 w-16" disabled={!hasScores && g.scoreMin == null}
              value={g.scoreMin ?? ""} onChange={(e) => onChange({ scoreMin: num(e.target.value) })} />
            <span className="text-muted-foreground">–</span>
            <Input aria-label="Điểm đến (không gồm)" inputMode="decimal" placeholder="dưới" className="h-8 w-16" disabled={!hasScores && g.scoreMax == null}
              value={g.scoreMax ?? ""} onChange={(e) => onChange({ scoreMax: num(e.target.value) })} />
          </div>
        </div>
        <label className="flex items-center gap-2 pb-1.5 text-sm">
          <input type="checkbox" checked={g.forSupport} onChange={(e) => onChange({ forSupport: e.target.checked })} />
          Ưu tiên học sinh cần hỗ trợ
        </label>
      </div>
    </div>
  );
}
