// app/(auth)/(admin)/layout.tsx
// 管理者専用ページ用レイアウト

import { requireAdmin } from "@/lib/auth/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return <>{children}</>
}
