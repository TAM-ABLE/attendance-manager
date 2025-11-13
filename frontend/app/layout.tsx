// app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { getCurrentUser } from "@/lib/auth"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "勤怠管理システム",
  description: "Next.js + NextAuth Sample",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <html lang="ja">
      <body className={`min-h-screen bg-background ${geistSans.variable} ${geistMono.variable}`}>
        <Header currentUser={user} />
        <main className="container mx-auto p-6 max-w-7xl">{children}</main>
        <Footer />
      </body>
    </html>
  )
}