"use client";
import { Pencil, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DocField } from "./fields";
import { colorOf, type EActivity, type EGroup, type ELesson, type ETask, type Selection } from "./types";

function Block({ id, selected, onSelect, title, children, className }: { id: string; selected: boolean; onSelect: () => void; title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} onFocusCapture={onSelect} onClick={onSelect}
      className={cn("relative scroll-mt-24 rounded-lg border border-transparent p-4 transition-colors", selected ? "border-primary/40 bg-primary-soft/30 ring-1 ring-primary/20" : "hover:border-slate-200", className)}>
      {selected && <span className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white print:hidden"><Pencil className="size-3" /> Đang chỉnh sửa</span>}
      {title && <h2 className="mb-2 text-base font-bold uppercase tracking-wide text-slate-800">{title}</h2>}
      {children}
    </section>
  );
}

export function LessonDocument({ l, groups, sel, setSel, set, setAct, setTask }: {
  l: ELesson; groups: EGroup[]; sel: Selection; setSel: (s: Selection) => void;
  set: (p: Partial<ELesson>) => void; setAct: (key: string, p: Partial<EActivity>) => void; setTask: (key: string, groupId: string, p: Partial<ETask>) => void;
}) {
  const isSec = (k: string) => sel?.kind === "section" && sel.key === k;
  const taskOf = (a: EActivity, gid: string) => a.tasks.find((t) => t.groupId === gid);
  return (
    <article className="mx-auto max-w-[52rem] space-y-2 rounded-xl border bg-white px-3 py-6 shadow-sm sm:px-8">
      <header className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Kế hoạch bài dạy</p>
        <h1 className="mt-1 text-2xl font-bold">{l.title || "Tên bài học"}</h1>
        <p className="text-sm text-muted-foreground">Môn {l.subject} · {l.periods} tiết{l.methods ? ` · ${l.methods}` : ""}</p>
      </header>

      <Block id="objectives" selected={isSec("objectives")} onSelect={() => setSel({ kind: "section", key: "objectives" })} title="I. Mục tiêu">
        <DocField label="Yêu cầu cần đạt" value={l.requirements} onChange={(v) => set({ requirements: v })} placeholder="Mỗi dòng một yêu cầu cần đạt" />
        <DocField label="1. Kiến thức" value={l.knowledgeGoals} onChange={(v) => set({ knowledgeGoals: v })} placeholder="Học sinh hiểu được…" />
        <DocField label="2. Năng lực" value={l.competencyGoals} onChange={(v) => set({ competencyGoals: v })} placeholder="Năng lực chung, năng lực đặc thù…" />
        <DocField label="3. Phẩm chất" value={l.qualityGoals} onChange={(v) => set({ qualityGoals: v })} placeholder="Chăm chỉ, trách nhiệm…" />
      </Block>

      <Block id="materials" selected={isSec("materials")} onSelect={() => setSel({ kind: "section", key: "materials" })} title="II. Thiết bị dạy học và học liệu">
        <DocField value={l.materials} onChange={(v) => set({ materials: v })} placeholder="SGK, phiếu học tập theo nhóm, máy chiếu…" />
      </Block>

      <h2 id="progression" className="scroll-mt-24 px-4 pt-2 text-base font-bold uppercase tracking-wide text-slate-800">III. Tiến trình dạy học</h2>
      {l.activities.map((a) => {
        const actSel = (sel?.kind === "activity" || sel?.kind === "task") && sel.key === a.key;
        return (
          <Block key={a.key} id={`act-${a.key}`} selected={sel?.kind === "activity" && sel.key === a.key} onSelect={() => setSel({ kind: "activity", key: a.key })} className={cn(actSel && sel?.kind === "task" && "border-slate-200")}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Input aria-label="Tên hoạt động" value={a.title} onChange={(e) => setAct(a.key, { title: e.target.value })} className="h-9 min-w-0 flex-1 border-transparent px-2 text-base font-bold hover:border-slate-200" />
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Input aria-label="Số phút" type="number" min={1} value={a.minutes ?? ""} onChange={(e) => setAct(a.key, { minutes: e.target.value ? Number(e.target.value) : null })} className="h-8 w-16" /> phút</span>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground print:hidden"><input type="checkbox" checked={a.byGroup} onChange={(e) => setAct(a.key, { byGroup: e.target.checked })} /> Phân hóa theo nhóm</label>
            </div>
            <div className="grid gap-x-4 md:grid-cols-2">
              <DocField label="a) Mục tiêu" value={a.goal} onChange={(v) => setAct(a.key, { goal: v })} />
              <DocField label="b) Nội dung" value={a.content} onChange={(v) => setAct(a.key, { content: v })} />
              <DocField label="c) Sản phẩm" value={a.product} onChange={(v) => setAct(a.key, { product: v })} />
              <DocField label="d) Tổ chức thực hiện" value={a.organization} onChange={(v) => setAct(a.key, { organization: v })} className="md:col-span-2" />
            </div>
            {a.byGroup && (
              <div className="mt-3 space-y-2">
                <p className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><Users className="size-3.5" /> Nhiệm vụ phân hóa theo nhóm</p>
                {groups.map((g, gi) => {
                  const t = taskOf(a, g.id);
                  const c = colorOf(gi);
                  const tSel = sel?.kind === "task" && sel.key === a.key && sel.groupId === g.id;
                  return (
                    <div key={g.id} id={`task-${a.key}-${g.id}`} onClick={(e) => { e.stopPropagation(); setSel({ kind: "task", key: a.key, groupId: g.id }); }} onFocusCapture={(e) => { e.stopPropagation(); setSel({ kind: "task", key: a.key, groupId: g.id }); }}
                      className={cn("scroll-mt-24 rounded-md border border-l-4 p-2 transition-colors", c.border, tSel ? "bg-primary-soft/40 ring-1 ring-primary/30" : "hover:bg-slate-50")}>
                      <div className="mb-1 flex items-center gap-2 px-2">
                        <span className={cn("size-2 rounded-full", c.dot)} /><span className={cn("text-sm font-semibold", c.text)}>{g.name}</span>
                        <span className="text-xs text-muted-foreground">{g.members.length} HS</span>
                        {t?.challenge && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{t.challenge}</span>}
                        {tSel && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-white print:hidden">Đang chỉnh sửa</span>}
                      </div>
                      <DocField value={t?.task ?? ""} onChange={(v) => setTask(a.key, g.id, { task: v })} placeholder="Nhiệm vụ của nhóm…" />
                      {tSel || t?.materials || t?.product ? (
                        <div className="grid gap-x-3 sm:grid-cols-2">
                          <DocField label="Mức thử thách" value={t?.challenge ?? ""} onChange={(v) => setTask(a.key, g.id, { challenge: v })} />
                          <DocField label="Học liệu" value={t?.materials ?? ""} onChange={(v) => setTask(a.key, g.id, { materials: v })} />
                          <DocField label="Sản phẩm" value={t?.product ?? ""} onChange={(v) => setTask(a.key, g.id, { product: v })} />
                          <DocField label="Hỗ trợ" value={t?.support ?? ""} onChange={(v) => setTask(a.key, g.id, { support: v })} />
                          <DocField label="Đánh giá theo nhóm" value={t?.assessment ?? ""} onChange={(v) => setTask(a.key, g.id, { assessment: v })} className="sm:col-span-2" />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </Block>
        );
      })}

      <Block id="assessment" selected={isSec("assessment")} onSelect={() => setSel({ kind: "section", key: "assessment" })} title="IV. Đánh giá">
        <DocField value={l.assessment} onChange={(v) => set({ assessment: v })} placeholder="Phương án đánh giá chung: tiêu chí, công cụ, hình thức…" />
      </Block>

      <Block id="matrix" selected={isSec("matrix")} onSelect={() => setSel({ kind: "section", key: "matrix" })} title="Bảng nhiệm vụ nhóm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-xs">
            <thead><tr><th className="border bg-slate-50 p-2 text-left">Hoạt động</th>{groups.map((g, gi) => <th key={g.id} className="border bg-slate-50 p-2 text-left"><span className={cn("mr-1 inline-block size-2 rounded-full", colorOf(gi).dot)} />{g.name}</th>)}</tr></thead>
            <tbody>
              {l.activities.filter((a) => a.byGroup).map((a) => (
                <tr key={a.key}>
                  <td className="border p-2 align-top font-medium">{a.title}</td>
                  {groups.map((g) => {
                    const t = a.tasks.find((x) => x.groupId === g.id);
                    return (
                      <td key={g.id} className="cursor-pointer border p-2 align-top hover:bg-primary-soft/40" onClick={(e) => { e.stopPropagation(); setSel({ kind: "task", key: a.key, groupId: g.id }); document.getElementById(`task-${a.key}-${g.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                        {t?.task ? <span className="line-clamp-4">{t.task}</span> : <span className="text-danger">Chưa có nhiệm vụ</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
    </article>
  );
}
