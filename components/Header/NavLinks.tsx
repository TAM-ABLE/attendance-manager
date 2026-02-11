"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getNavigation } from "./nav-items"

type NavLinksProps = {
  isAdmin: boolean
}

export function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname()
  const navigation = getNavigation(isAdmin)

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
