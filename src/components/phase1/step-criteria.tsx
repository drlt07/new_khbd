"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Loader2, Minus, Plus, Sparkles, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/ui/tag-input";
import { Alert } from "@/components/ui/alert";
import { useMutation } from "@/hooks/use-mutation";
import { GROUP_PRESETS, emptyGroup, type GroupDraft } from "@/lib/grouping/presets";
import { describeRange } from "@/lib/grouping/match";
import { cn } from "@/lib/utils";
import { StepFooter } from "./step-footer";

type G = GroupDraft & { key: string; id?: string };
type Eff = { keywords: string[]; scoreMin: number | null; scoreMax: number | null; forSupport: boolean; source: string[] };
let seq = 0;
const k = () => `c${++seq}`;

export function StepCriteria({ id, readOnly, initialGroups, balanceSizes, vocab, hasScores, studentCount }: {
  id: string; readOnly: boolean; initialGroups: (GroupDraft & { id: string })[]; balanceSizes: boolean; vocab: string[]; hasScores: boolean; studentCount: number;
}) {
  const router = useRouter();
  const [groups, setGroups] = useState<G[]>(() => initialGroups.length ? initialGroups.map((g) => ({ ...g, key: k() })) : GROUP_PRESETS[0].groups.map((g) => ({ ...g, key: k() })));
  const [balance, setBalance] = useState(balanceSizes);
  const [adv, setAdv] = useState<Record<string, boolean>>({});
  const [eff, setEff] = useState<Eff[] | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "analyze">("");
  const preview = useMutation();
  const save = useMutation();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const payload = () => ({ balanceSizes: balance, groups: groups.map(({ id: gid, name, description, keywords, scoreMin, scoreMax, forSupport, maxSize }) => ({ id: gid, name, description, keywords, scoreMin, scoreMax, forSupport, maxSize })) });

  // "Hệ thống hiểu…" — diễn giải lại sau mỗi lần GV sửa (debounce)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (groups.some((g) => !g.name.trim())) return;
      const r = await preview.mutate<Eff[]>(`/api/sessions/${id}/criteria/preview`, "POST", payload(), { refresh: false });
      if (r.ok) setEff(r.data);
    }, 500);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const patch = (key: string, p: Partial<G>) => setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...p } : g)));
  const setCount = (n: number) => setGroups((gs) => (n > gs.length ? [...gs, ...Array.from({ length: n - gs.length }, (_, i) => ({ ...emptyGroup(gs.length + i), key: k() }))] : gs.slice(0, n)));
  const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

  async function saveAndAnalyze() {
    setBusy("save");
    const r = await save.mutate(`/api/sessions/${id}/criteria`, "PUT", payload(), { refresh: false });
    if (!r.ok) return setBusy("");
    setBusy("analyze");
    const a = await save.mutate(`/api/sessions/${id}/analyze`, "POST", undefined, { refresh: false });
    setBusy("");
    if (a.ok) { router.push(`/phase1/${id}?step=3`); router.refresh(); }
  }

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div className="flex-1">
          <h3 className="font-semibold">Số nhóm cố định</h3>
          <p className="text-sm text-muted-foreground">Mỗi nhóm được mô tả bằng lời — AI dùng mô tả này cùng điểm số và đặc trưng học sinh để phân bổ.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Bớt một nhóm" disabled={readOnly || groups.length <= 2} onClick={() => setCount(groups.length - 1)}><Minus /></Button>
          <span className="w-16 text-center text-2xl font-semibold tabular-nums" aria-live="polite">{groups.length}<span className="block text-[11px] font-normal text-muted-foreground">nhóm</span></span>
          <Button variant="outline" size="icon" aria-label="Thêm một nhóm" disabled={readOnly || groups.length >= 12} onClick={() => setCount(groups.length + 1)}><Plus /></Button>
        </div>
      </Card>

      {!readOnly && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bắt đầu từ mẫu</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {GROUP_PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => setGroups(p.groups.map((g) => ({ ...g, keywords: [...g.keywords], key: k() })))}
                className="rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40">
                <p className="text-sm font-medium">{p.label}</p><p className="text-xs text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((g, i) => {
          const e = eff?.[i];
          const range = e ? describeRange(e) : null;
          return (
            <Card key={g.key} className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">{i + 1}</span>
                <Input aria-label={`Tên nhóm ${i + 1}`} value={g.name} disabled={readOnly} onChange={(ev) => patch(g.key, { name: ev.target.value })} className="font-semibold" />
                {!readOnly && groups.length > 2 && <button type="button" aria-label={`Xóa ${g.name}`} onClick={() => setGroups((gs) => gs.filter((x) => x.key !== g.key))} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>}
              </div>
              <div className="space-y-1">
                <label htmlFor={`${g.key}-d`} className="text-xs font-medium text-muted-foreground">Mô tả đặc trưng mong muốn của nhóm</label>
                <Textarea id={`${g.key}-d`} rows={2} disabled={readOnly} value={g.description} onChange={(ev) => patch(g.key, { description: ev.target.value })}
                  placeholder="Ví dụ: Học sinh có năng lực tốt, khả năng tự học cao" />
              </div>
              <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
                <p className="mb-1 flex items-center gap-1 font-medium text-slate-600"><Sparkles className="size-3.5 text-primary" /> Hệ thống hiểu {preview.pending && <Loader2 className="size-3 animate-spin" />}</p>
                {e ? (
                  <div className="flex flex-wrap gap-1">
                    {range && <span className="rounded-full bg-info-soft px-2 py-0.5 text-info">Điểm {range}</span>}
                    {e.keywords.map((kw) => <span key={kw} className="rounded-full bg-success-soft px-2 py-0.5 text-success">{kw}</span>)}
                    {e.forSupport && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-warning">Ưu tiên HS cần hỗ trợ</span>}
                    {g.maxSize && <span className="rounded-full bg-muted px-2 py-0.5">Tối đa {g.maxSize} HS</span>}
                    {!range && !e.keywords.length && !e.forSupport && <span className="text-muted-foreground">Chưa nhận ra tiêu chí cụ thể — hãy mô tả rõ hơn (mức năng lực, thế mạnh, nhu cầu) hoặc đặt tiêu chí nâng cao.</span>}
                    {e.source.some((x) => x.includes("chưa có bảng điểm")) && <span className="w-full text-warning">Chưa chọn bảng điểm ở bước 1 nên mức năng lực chưa áp dụng được.</span>}
                  </div>
                ) : <span className="text-muted-foreground">Đang diễn giải…</span>}
              </div>
              <button type="button" onClick={() => setAdv((a) => ({ ...a, [g.key]: !a[g.key] }))} aria-expanded={!!adv[g.key]} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <ChevronDown className={cn("size-3.5 transition-transform", adv[g.key] && "rotate-180")} /> Tiêu chí nâng cao (ghi đè diễn giải)
              </button>
              {adv[g.key] && (
                <div className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1"><label htmlFor={`${g.key}-kw`} className="text-xs font-medium text-muted-foreground">Thế mạnh / sở thích phù hợp</label>
                    <TagInput id={`${g.key}-kw`} value={g.keywords} onChange={(keywords) => patch(g.key, { keywords })} suggestions={vocab} placeholder="Gõ rồi Enter" tone="success" /></div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="space-y-1"><span className="text-xs font-medium text-muted-foreground">Khoảng điểm{!hasScores && " (cần bảng điểm)"}</span>
                      <div className="flex items-center gap-1.5">
                        <Input aria-label="Điểm từ" inputMode="decimal" placeholder="từ" className="h-8 w-16" disabled={readOnly} value={g.scoreMin ?? ""} onChange={(ev) => patch(g.key, { scoreMin: num(ev.target.value) })} />–
                        <Input aria-label="Điểm dưới" inputMode="decimal" placeholder="dưới" className="h-8 w-16" disabled={readOnly} value={g.scoreMax ?? ""} onChange={(ev) => patch(g.key, { scoreMax: num(ev.target.value) })} />
                      </div></div>
                    <div className="space-y-1"><label htmlFor={`${g.key}-max`} className="text-xs font-medium text-muted-foreground">Sĩ số tối đa</label>
                      <Input id={`${g.key}-max`} type="number" min={1} className="h-8 w-20" disabled={readOnly} value={g.maxSize ?? ""} onChange={(ev) => patch(g.key, { maxSize: ev.target.value ? Number(ev.target.value) : null })} /></div>
                    <label className="flex items-center gap-2 pb-1.5 text-sm"><input type="checkbox" disabled={readOnly} checked={g.forSupport} onChange={(ev) => patch(g.key, { forSupport: ev.target.checked })} /> Ưu tiên HS cần hỗ trợ</label>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5" disabled={readOnly} checked={balance} onChange={(e) => setBalance(e.target.checked)} />
          <span>Giữ sĩ số các nhóm bằng nhau<br /><span className="text-xs text-muted-foreground">Mặc định tắt: mỗi học sinh vào nhóm phù hợp nhất, sĩ số theo thực tế (có thể đặt sĩ số tối đa cho từng nhóm).</span></span>
        </label>
      </Card>

      {(save.error || preview.error) && <Alert tone="danger">{save.error ?? preview.error}</Alert>}
      {!readOnly && (
        <StepFooter hint={`${studentCount} học sinh → ${groups.length} nhóm. Lưu tiêu chí sẽ chạy lại phân nhóm.`}>
          <Button onClick={saveAndAnalyze} disabled={!!busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy === "analyze" ? "AI đang phân tích…" : busy === "save" ? "Đang lưu…" : "Lưu tiêu chí & phân nhóm"} {!busy && <ArrowRight />}
          </Button>
        </StepFooter>
      )}
    </div>
  );
}
