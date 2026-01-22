"use client"

import { Button } from "@/components/ui/button"
import { logout } from "@/lib/api-client"
import { useRouter } from "next/navigation"

type LogoutButtonProps = {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleLogout}>
      ログアウト
    </Button>
  )
}
