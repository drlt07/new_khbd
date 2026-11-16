import Link from "next/link";
import { FilePlus2, Library, Upload, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  { href: "/classes", label: "Tạo lớp học", desc: "Khai báo lớp, năm học, môn học", icon: Library },
  { href: "/students", label: "Thêm học sinh", desc: "Nhập tay hoặc từ Excel", icon: UserPlus },
  { href: "/data-intake", label: "Cung cấp dữ liệu", desc: "Nhận xét, bảng điểm, sản phẩm", icon: Upload },
  { href: "/lesson-plans/new", label: "Tạo KHBD", desc: "Wizard 6 bước có cá thể hóa", icon: FilePlus2 },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
          >
            <a.icon className="size-5 text-primary" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{a.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.desc}</span>
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
