import { Library, Shuffle, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/groups", label: "Chia nhóm", icon: Shuffle },
  { href: "/classes", label: "Lớp học", icon: Library },
  { href: "/students", label: "Học sinh", icon: Users },
];
