import { BookCopy, FolderOpen, Library, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/classes", label: "Lớp học của tôi", icon: Library },
  { href: "/students", label: "Dữ liệu học sinh", icon: Users },
];

export const WORKFLOW_NAV = [
  { href: "/phase1", no: "01", label: "Phân tích & phân nhóm", phase: "Pha 1", steps: "Hồ sơ học sinh · Tiêu chí · Phân nhóm · Duyệt nhóm" },
  { href: "/phase2", no: "02", label: "Thiết kế KHBD", phase: "Pha 2", steps: "Bài học · Tiến trình · Nhiệm vụ phân hóa · Đánh giá" },
] as const;

export const LIBRARY_NAV: NavItem[] = [
  { href: "/library/lessons", label: "Kho KHBD", icon: BookCopy },
  { href: "/library/resources", label: "Học liệu & tài nguyên", icon: FolderOpen },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];
