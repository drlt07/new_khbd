import { BookOpenCheck, Library, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/classes", label: "Lớp học", icon: Library },
  { href: "/lessons", label: "Kế hoạch bài dạy", icon: BookOpenCheck },
];

/** Các tab trong một lớp — sắp theo đúng thứ tự công việc của 2 pha */
export const CLASS_TABS = [
  { slug: "", label: "Tổng quan" },
  { slug: "students", label: "Học sinh & đặc trưng", phase: 1 },
  { slug: "scores", label: "Bảng điểm", phase: 1 },
  { slug: "groups", label: "Chia nhóm", phase: 1 },
  { slug: "lessons", label: "Soạn KHBD", phase: 2 },
] as const;
