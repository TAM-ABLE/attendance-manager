"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Clock, Mail, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
    const router = useRouter()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // ① Hono API へ新規登録
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            })

            if (!res.ok) {
                setLoading(false)
                return
            }

            // ② 登録成功 → 自動ログイン
            const login = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (login?.error) {
                setLoading(false)
                return
            }

            // ③ ダッシュボードへ
            router.push("/dashboard")
            router.refresh()
        } catch (err: unknown) {
            console.error("Error during sign-up:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                            <Clock className="h-10 w-10 text-white" />
                        </div>
                    </div>

                    <div>
                        <CardTitle>新規アカウント作成</CardTitle>
                        <CardDescription className="mt-2">
                            勤怠管理システムを利用するためのアカウントを作成します
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* 名前 */}
                        <div className="space-y-2">
                            <Label htmlFor="name">名前</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="山田 太郎"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* メール */}
                        <div className="space-y-2">
                            <Label htmlFor="email">メールアドレス</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your.email@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* パスワード */}
                        <div className="space-y-2">
                            <Label htmlFor="password">パスワード</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button className="w-full" size="lg" disabled={loading}>
                            {loading ? "作成中..." : "アカウントを作成"}
                        </Button>
                    </form>

                    <div className="text-center text-sm">
                        すでにアカウントをお持ちの方？{" "}
                        <button
                            className="text-blue-600 hover:underline"
                            onClick={() => router.push("/login")}
                        >
                            ログイン
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}