"use client"

import { Button } from "@/components/ui/button"
import { FileText, History, LayoutDashboard, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLinksProps = {
  isAdmin: boolean
}

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/attendance-history", label: "勤怠履歴", icon: History },
]

const adminNavItems = [
  { href: "/report-list", label: "日報一覧", icon: FileText },
  { href: "/admin", label: "管理者", icon: Users },
]

export function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname()
  const navigation = isAdmin ? [...navItems, ...adminNavItems] : navItems

  return (
    <nav className="hidden md:flex gap-2 ml-auto">
      {navigation.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Button
            key={href}
            asChild
            variant={isActive ? "default" : "ghost"}
            className={`gap-2 ${isActive ? "bg-primary text-white" : ""}`}
          >
            <Link href={href}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
