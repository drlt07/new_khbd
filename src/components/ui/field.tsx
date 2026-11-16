import { Label } from "./label";
import { cn } from "@/lib/utils";

/** Bọc nhãn + control + lỗi cho mọi loại input. */
export function Field({
  label, htmlFor, error, hint, children, className, required,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-danger">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
