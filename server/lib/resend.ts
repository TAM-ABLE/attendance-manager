export class ResendError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ResendError"
  }
}

interface SendEmailOptions {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendEmail(apiKey: string, options: SendEmailOptions): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(options),
  })

  if (!res.ok) {
    const error = (await res.json()) as { message?: string }
    throw new ResendError(error.message || "Failed to send email", res.status)
  }
}

export function buildInviteEmailHtml(actionLink: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>勤怠管理システムへの招待</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 32px; text-align: center;">
    <h1 style="color: #1a1a2e; font-size: 20px; margin-bottom: 16px;">勤怠管理システムへの招待</h1>
    <p style="margin-bottom: 24px;">
      勤怠管理システムのアカウントが作成されました。<br>
      以下のボタンからパスワードを設定してログインしてください。
    </p>
    <a href="${actionLink}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: bold;">
      パスワードを設定する
    </a>
    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      このリンクは24時間有効です。期限が切れた場合は、管理者に再送を依頼してください。
    </p>
  </div>
</body>
</html>`
}

export function buildRecoveryEmailHtml(actionLink: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>パスワードリセット</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 32px; text-align: center;">
    <h1 style="color: #1a1a2e; font-size: 20px; margin-bottom: 16px;">パスワードリセット</h1>
    <p style="margin-bottom: 24px;">
      パスワードリセットのリクエストを受け付けました。<br>
      以下のボタンから新しいパスワードを設定してください。
    </p>
    <a href="${actionLink}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: bold;">
      パスワードを再設定する
    </a>
    <p style="margin-top: 24px; font-size: 14px; color: #666;">
      このリンクは24時間有効です。心当たりがない場合は、このメールを無視してください。
    </p>
  </div>
</body>
</html>`
}
