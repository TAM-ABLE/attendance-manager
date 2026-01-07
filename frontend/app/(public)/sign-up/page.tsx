"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Clock, Mail, Lock, User, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { registerAction } from "@/app/actions/auth"

// パスワード強度チェック
function usePasswordStrength(password: string) {
    return useMemo(() => {
        const checks = {
            minLength: password.length >= 8,
            hasLetter: /[a-zA-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
        };
        // 全ての条件を満たす必要がある
        const isValid = checks.minLength && checks.hasLetter && checks.hasNumber;
        return { checks, isValid };
    }, [password]);
}

export default function SignUpPage() {
    const router = useRouter()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const passwordStrength = usePasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // パスワード強度チェック
        if (!passwordStrength.isValid) {
            setError("パスワードが要件を満たしていません。")
            setLoading(false)
            return
        }

        // 成功時はServer Action内でredirectされるため、戻り値はエラー時のみ
        const result = await registerAction(name, email, password)

        // ここに到達 = エラー
        setLoading(false)
        setError(result.error || "アカウント作成に失敗しました。")
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
                            {/* パスワード強度インジケーター */}
                            {password && (
                                <div className="text-xs space-y-1 mt-2">
                                    <div className="flex items-center gap-1">
                                        {passwordStrength.checks.minLength ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <X className="h-3 w-3 text-red-500" />
                                        )}
                                        <span className={passwordStrength.checks.minLength ? "text-green-600" : "text-muted-foreground"}>
                                            8文字以上
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {passwordStrength.checks.hasLetter ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <X className="h-3 w-3 text-red-500" />
                                        )}
                                        <span className={passwordStrength.checks.hasLetter ? "text-green-600" : "text-muted-foreground"}>
                                            英字を含む
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {passwordStrength.checks.hasNumber ? (
                                            <Check className="h-3 w-3 text-green-500" />
                                        ) : (
                                            <X className="h-3 w-3 text-red-500" />
                                        )}
                                        <span className={passwordStrength.checks.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                                            数字を含む
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

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
