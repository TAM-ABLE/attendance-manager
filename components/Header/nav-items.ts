import type { LucideIcon } from "lucide-react"
import { FileText, History, LayoutDashboard, Pencil, Users } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/attendance-history", label: "勤怠履歴", icon: History },
  { href: "/edit-attendance", label: "勤怠編集", icon: Pencil },
]

export const adminNavItems: NavItem[] = [
  { href: "/report-list", label: "日報一覧", icon: FileText },
  { href: "/admin", label: "管理者", icon: Users },
]

export function getNavigation(isAdmin: boolean): NavItem[] {
  return isAdmin ? [...navItems, ...adminNavItems] : navItems
}
