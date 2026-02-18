"use client"

import { Check, Clock, Info, KeyRound, Lock, Mail, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePasswordStrength } from "@/hooks/usePasswordStrength"
import { firstLogin } from "@/lib/api-client"

function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      {passed ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={passed ? "text-green-600" : "text-muted-foreground"}>{label}</span>
    </div>
  )
}

export default function FirstLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordStrength = usePasswordStrength(newPassword)
  const passwordsMatch = newPassword === newPasswordConfirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordStrength.isValid) {
      setError("新しいパスワードの要件を満たしてください。")
      return
    }
    if (!passwordsMatch) {
      setError("新しいパスワードが一致しません。")
      return
    }

    setLoading(true)
    setError(null)

    const result = await firstLogin(email, password, newPassword)

    if (result.success) {
      router.push("/dashboard")
      router.refresh()
      return
    }

    setLoading(false)
    setError(result.error || "パスワード変更に失敗しました。")
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <Clock className="h-10 w-10 text-white" />
          </div>
        </div>
        <div>
          <CardTitle>勤怠管理システム</CardTitle>
          <CardDescription className="mt-2">初回パスワード変更</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            管理者から受け取った初期パスワードを新しいパスワードに変更します。
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-email">メールアドレス</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="first-email"
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
            <Label htmlFor="current-password">初期パスワード</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                placeholder="管理者から受け取ったパスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">新しいパスワード</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {newPassword.length > 0 && (
              <div className="text-xs space-y-1 mt-2">
                <PasswordCheck passed={passwordStrength.checks.minLength} label="8文字以上" />
                <PasswordCheck passed={passwordStrength.checks.hasLetter} label="英字を含む" />
                <PasswordCheck passed={passwordStrength.checks.hasNumber} label="数字を含む" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password-confirm">新しいパスワード（確認）</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password-confirm"
                type="password"
                placeholder="••••••••"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {newPasswordConfirm.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="h-3 w-3" />
                パスワードが一致しません
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !passwordStrength.isValid || !passwordsMatch}
          >
            {loading ? "処理中..." : "パスワードを変更してログイン"}
          </Button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            通常のログインに戻る
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
