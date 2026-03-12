import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  fullScreen?: boolean
}

export function ErrorFallback({ error, reset, fullScreen }: ErrorFallbackProps) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[50vh]"}`}
    >
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <h2 className="text-lg font-semibold">エラーが発生しました</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "予期しないエラーが発生しました。再度お試しください。"}
          </p>
          <Button onClick={reset}>再試行</Button>
        </CardContent>
      </Card>
    </div>
  )
}
