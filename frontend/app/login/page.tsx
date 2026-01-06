"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Lock, Mail, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async (loginEmail: string, loginPassword: string) => {
        setLoading(true)
        setError(null)

        const result = await login(loginEmail, loginPassword)

        setLoading(false)

        if (!result.success) {
            setError("メールアドレスまたはパスワードが間違っています。")
            return
        }

        router.push("/dashboard")
        router.refresh()
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleLogin(email, password)
    }

    const handleDemoLogin = (demoEmail: string) => {
        handleLogin(demoEmail, "password123")
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
                        <CardTitle>勤怠管理システム</CardTitle>
                        <CardDescription className="mt-2">
                            チームの勤怠と日報を簡単管理
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Alert className="bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-900">
                            <p className="mb-2">デモアカウント（クリックでログイン）:</p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleDemoLogin("admin@example.com")}
                                    className="w-full text-left p-2 rounded bg-white hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                                            管理
                                        </div>
                                        <div>
                                            <p className="text-sm">管理者アカウント</p>
                                            <p className="text-xs text-muted-foreground">admin@example.com</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDemoLogin("user@example.com")}
                                    className="w-full text-left p-2 rounded bg-white hover:bg-blue-100 border border-blue-200 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs">
                                            一般
                                        </div>
                                        <div>
                                            <p className="text-sm">一般ユーザーアカウント</p>
                                            <p className="text-xs text-muted-foreground">user@example.com</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <Button type="submit" className="w-full" size="lg" disabled={loading}>
                            {loading ? "ログイン中..." : "ログイン"}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/sign-up")}
                        >
                            新規アカウント作成
                        </Button>

                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
