"use client";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export type FilterDef =
  | { type: "search"; name: string; placeholder: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[] };

/** Bộ lọc đồng bộ với URL (?q=&year=...) — có thể chia sẻ link, Server Component tự lọc dữ liệu. */
export function UrlFilters({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchDef = filters.find((f) => f.type === "search");
  const [q, setQ] = useState(searchDef ? params.get(searchDef.name) ?? "" : "");

  function set(name: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(name, value);
    else next.delete(name);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`));
  }

  // Debounce ô tìm kiếm
  useEffect(() => {
    if (!searchDef) return;
    const current = params.get(searchDef.name) ?? "";
    if (q === current) return;
    const t = setTimeout(() => set(searchDef.name, q.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {filters.map((f) =>
        f.type === "search" ? (
          <div key={f.name} className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label={f.placeholder} placeholder={f.placeholder} value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
        ) : (
          <div key={f.name} className="sm:w-48">
            <Select aria-label={f.label} value={params.get(f.name) ?? ""} onChange={(e) => set(f.name, e.target.value)}>
              <option value="">{f.label}: tất cả</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        ),
      )}
      {isPending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Đang lọc" />}
    </div>
  );
}
