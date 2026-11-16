import {
  BarChart3, BookOpenCheck, BrainCircuit, ClipboardList, FilePlus2, FolderOpen, LayoutDashboard,
  Library, Settings, ShieldCheck, Upload, UserRound, Users, type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Sprint dự kiến hoàn thiện; undefined = đã triển khai */
  plannedSprint?: number;
  description: string;
  roles?: UserRole[];
};

export type NavGroup = { label: string; items: NavItem[] };

/**
 * Menu được tổ chức theo luồng nghiệp vụ: Lớp học -> Hồ sơ học sinh -> KHBD.
 * 17 module của Phần 6 được gom thành các mục dưới đây (một số module là bước con trong wizard).
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [{ href: "/dashboard", label: "Bảng điều khiển", icon: LayoutDashboard, description: "Tổng quan lớp học, hồ sơ và KHBD." }],
  },
  {
    label: "Lớp học",
    items: [
      { href: "/classes", label: "Lớp học", icon: Library, description: "Tạo lớp, khai báo năm học, môn học; quản lý danh sách lớp." },
      { href: "/students", label: "Học sinh", icon: Users, description: "Thêm học sinh, nhập danh sách từ Excel, tìm kiếm và lọc." },
    ],
  },
  {
    label: "Hồ sơ học sinh",
    items: [
      { href: "/frameworks", label: "Khung thông tin", icon: ClipboardList, description: "Thiết lập phương diện A–F và tiêu chí theo dõi, tùy chỉnh theo môn học." },
      { href: "/data-intake", label: "Tiếp nhận dữ liệu", icon: Upload, plannedSprint: 3, description: "Nhập nhận xét, tải bảng điểm, bài kiểm tra, sản phẩm, ảnh minh chứng." },
      { href: "/evidence", label: "Minh chứng", icon: FolderOpen, plannedSprint: 3, description: "Xem trước, phân loại, gắn minh chứng với học sinh, môn học, tiêu chí." },
      { href: "/analysis", label: "Phân tích AI", icon: BrainCircuit, plannedSprint: 4, description: "AI phân tích dữ liệu; giáo viên đồng ý, chỉnh sửa, từ chối hoặc yêu cầu phân tích lại." },
      { href: "/profiles", label: "Hồ sơ học sinh", icon: UserRound, description: "Hồ sơ đa phương diện, có minh chứng và lịch sử cập nhật." },
    ],
  },
  {
    label: "Kế hoạch bài dạy",
    items: [
      { href: "/lesson-plans/new", label: "Tạo KHBD", icon: FilePlus2, plannedSprint: 5, description: "Wizard 6 bước: bài học → mục tiêu → hồ sơ lớp → nhóm & nhiệm vụ → tạo KHBD → hoàn thiện." },
      { href: "/lesson-plans", label: "Quản lý KHBD", icon: BookOpenCheck, plannedSprint: 6, description: "Danh sách KHBD, phiên bản, xuất Word/PDF." },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/users", label: "Tài khoản & phân quyền", icon: ShieldCheck, plannedSprint: 7, roles: ["ADMIN", "SCHOOL_MANAGER"], description: "Quản lý tài khoản giáo viên và quyền truy cập." },
      { href: "/audit", label: "Nhật ký hoạt động", icon: BarChart3, plannedSprint: 7, description: "Lịch sử truy cập và chỉnh sửa dữ liệu." },
      { href: "/settings", label: "Cài đặt", icon: Settings, description: "Thông tin tài khoản và cấu hình AI." },
    ],
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  const all = NAV_GROUPS.flatMap((g) => g.items);
  return (
    all.find((i) => i.href === pathname) ??
    all
      .filter((i) => pathname.startsWith(`${i.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]
  );
}
