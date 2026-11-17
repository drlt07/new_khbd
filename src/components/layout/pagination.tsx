import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Phân trang theo URL — giữ nguyên các tham số lọc khác. */
export function Pagination({ page, pageCount, params, basePath }: { page: number; pageCount: number; params: Record<string, string | undefined>; basePath: string }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <nav className="mt-4 flex items-center justify-end gap-2 text-sm" aria-label="Phân trang">
      <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
        {page > 1 ? <Link href={href(page - 1)}><ChevronLeft /> Trước</Link> : <span><ChevronLeft /> Trước</span>}
      </Button>
      <span className="tabular-nums text-muted-foreground">Trang {page}/{pageCount}</span>
      <Button asChild={page < pageCount} variant="outline" size="sm" disabled={page >= pageCount}>
        {page < pageCount ? <Link href={href(page + 1)}>Sau <ChevronRight /></Link> : <span>Sau <ChevronRight /></span>}
      </Button>
    </nav>
  );
}
