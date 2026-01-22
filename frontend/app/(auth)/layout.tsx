// app/(auth)/layout.tsx
// 認証必須ページ用レイアウト

import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { requireAuth } from "@/lib/auth/server"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <>
      <Header user={user} />
      <main className="container mx-auto p-6 max-w-7xl">{children}</main>
      <Footer />
    </>
  )
}
