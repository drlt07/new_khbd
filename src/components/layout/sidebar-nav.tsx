"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LIBRARY_NAV, WORKFLOW_NAV, WORKSPACE_NAV, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ engine, onNavigate }: { engine: { kind: "claude" | "rules"; label: string }; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      {children}
    </div>
  );
  const Item = ({ item }: { item: NavItem }) => (
    <Link href={item.href} onClick={onNavigate} aria-current={active(item.href) ? "page" : undefined}
      className={cn("flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13.5px] transition-colors",
        active(item.href) ? "bg-white font-medium text-slate-900 shadow-xs ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900")}>
      <item.icon className="size-4 shrink-0" /> {item.label}
    </Link>
  );
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <Link href="/dashboard" onClick={onNavigate} className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
        <span className="leading-tight">
          <span className="block text-[13px] font-bold tracking-wide">EDU AI WORKSPACE</span>
          <span className="block text-[11px] text-muted-foreground">Personalized Learning Assistant</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4" aria-label="Điều hướng chính">
        <Section title="Workspace"><div className="space-y-0.5">{WORKSPACE_NAV.map((i) => <Item key={i.href} item={i} />)}</div></Section>
        <Section title="Teaching workflow">
          <div className="space-y-1.5">
            {WORKFLOW_NAV.map((w) => (
              <Link key={w.href} href={w.href} onClick={onNavigate} aria-current={active(w.href) ? "page" : undefined}
                className={cn("block rounded-lg border px-3 py-2 transition-colors",
                  active(w.href) ? "border-primary/40 bg-white shadow-xs ring-1 ring-primary/20" : "border-transparent hover:border-slate-200 hover:bg-white")}>
                <span className="flex items-center gap-2">
                  <span className={cn("text-xs font-bold tabular-nums", active(w.href) ? "text-primary" : "text-slate-400")}>{w.no}.</span>
                  <span className="flex-1 text-[13.5px] font-medium">{w.label}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", w.phase === "Pha 1" ? "bg-info-soft text-info" : "bg-success-soft text-success")}>{w.phase}</span>
                </span>
                <span className="mt-0.5 block pl-6 text-[11px] leading-snug text-slate-500">{w.steps}</span>
              </Link>
            ))}
          </div>
        </Section>
        <Section title="Library"><div className="space-y-0.5">{LIBRARY_NAV.map((i) => <Item key={i.href} item={i} />)}</div></Section>
      </nav>
      <div className="border-t p-3">
        <Link href="/settings" onClick={onNavigate} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-600 hover:bg-white">
          <span className={cn("size-2 rounded-full", engine.kind === "claude" ? "bg-success" : "bg-warning")} />
          Bộ máy: <b className="font-medium">{engine.label}</b>
        </Link>
      </div>
    </div>
  );
}
