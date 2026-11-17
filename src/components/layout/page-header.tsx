import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({ title, description, actions, crumbs, eyebrow }: {
  title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; crumbs?: { label: string; href?: string }[]; eyebrow?: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      {crumbs && (
        <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3" />}
              {c.href ? <Link href={c.href} className="hover:text-foreground">{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          {eyebrow}
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
