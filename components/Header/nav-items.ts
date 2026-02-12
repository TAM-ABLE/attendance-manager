import type { LucideIcon } from "lucide-react"
import { FileText, History, LayoutDashboard, Pencil, Users } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/attendance-history", label: "勤怠履歴", icon: History },
  { href: "/edit-attendance", label: "勤怠編集", icon: Pencil },
  { href: "/report-list", label: "日報一覧", icon: FileText },
]

export const adminNavItems: NavItem[] = [
  { href: "/admin", label: "管理者", icon: Users },
  { href: "/report-list", label: "日報一覧", icon: FileText },
]

export function getNavigation(isAdmin: boolean): NavItem[] {
  return isAdmin ? adminNavItems : userNavItems
}
