"use client"

import { Check, Clock, KeyRound, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePasswordStrength } from "@/hooks/usePasswordStrength"
import { setPassword, verifyOtp } from "@/lib/api-client"

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

type FlowType = "invite" | "recovery"

export default function SetPasswordPage() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [flowType, setFlowType] = useState<FlowType>("invite")
  const [tokenError, setTokenError] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const passwordStrength = usePasswordStrength(newPassword)
  const passwordsMatch = newPassword === newPasswordConfirm

  const isRecovery = flowType === "recovery"

  useEffect(() => {
    // 新フロー: query params の token_hash を verify-otp で access_token に変換
    const searchParams = new URLSearchParams(window.location.search)
    const tokenHash = searchParams.get("token_hash")
    const queryType = searchParams.get("type")

    if (!tokenHash || (queryType !== "invite" && queryType !== "recovery")) {
      setTokenError(true)
      return
    }

    setFlowType(queryType)
    // 検証後に URL から token_hash を消す（ブラウザ履歴・Referer への漏洩防止）
    window.history.replaceState({}, "", window.location.pathname)
    verifyOtp(tokenHash, queryType).then((result) => {
      if (result.success) {
        setAccessToken(result.accessToken)
      } else {
        setTokenError(true)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accessToken) return

    if (!passwordStrength.isValid) {
      setError("パスワードの要件を満たしてください。")
      return
    }
    if (!passwordsMatch) {
      setError("パスワードが一致しません。")
      return
    }

    setLoading(true)
    setError(null)

    const result = await setPassword(accessToken, newPassword)

    if (result.success) {
      router.push("/dashboard")
      router.refresh()
      return
    }

    setLoading(false)
    setError(result.error || "パスワード設定に失敗しました。")
  }

  if (tokenError) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-destructive flex items-center justify-center">
              <X className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle>無効なリンク</CardTitle>
            <CardDescription className="mt-2">
              リンクが無効または期限切れです。管理者にメールの再送を依頼してください。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!accessToken) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
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
          <CardDescription className="mt-2">
            {isRecovery ? "パスワードリセット" : "パスワード設定"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <KeyRound className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            {isRecovery
              ? "新しいパスワードを設定してください。設定後、自動的にログインします。"
              : "アカウントのパスワードを設定してください。設定後、自動的にログインします。"}
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">パスワード</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                placeholder="8文字以上（英字・数字を含む）"
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
            <Label htmlFor="new-password-confirm">パスワード（確認）</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password-confirm"
                type="password"
                placeholder="もう一度入力してください"
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
            {loading
              ? "設定中..."
              : isRecovery
                ? "パスワードを再設定してログイン"
                : "パスワードを設定してログイン"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
