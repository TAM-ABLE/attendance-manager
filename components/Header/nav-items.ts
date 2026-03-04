import type { LucideIcon } from "lucide-react"
import { Bell, CalendarDays, FileText, LayoutDashboard, Pencil, Users } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/edit-attendance", label: "勤怠編集", icon: Pencil },
  { href: "/report-list", label: "日報履歴", icon: FileText },
]

export const adminNavItems: NavItem[] = [
  { href: "/admin/users", label: "ユーザー管理", icon: Users },
  { href: "/admin/monthly", label: "月別詳細", icon: CalendarDays },
  { href: "/admin/reports", label: "日報提出状況", icon: FileText },
  { href: "/report-list", label: "日報履歴", icon: FileText },
  { href: "/admin/settings", label: "通知設定", icon: Bell },
]

export function getNavigation(isAdmin: boolean): NavItem[] {
  return isAdmin ? adminNavItems : userNavItems
}
