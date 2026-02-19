interface SlackUploadResult {
  success: boolean
  error?: string
}

interface GetUploadUrlResponse {
  ok: boolean
  upload_url?: string
  file_id?: string
  error?: string
}

interface CompleteUploadResponse {
  ok: boolean
  error?: string
}

/**
 * Slack v2ファイルアップロードフロー:
 * 1. files.getUploadURLExternal でアップロードURL取得
 * 2. PUT でファイルコンテンツをアップロード
 * 3. files.completeUploadExternal でチャンネルに投稿
 */
export async function uploadCsvToSlack(
  botToken: string,
  channelId: string,
  fileName: string,
  csvBuffer: Buffer,
  initialComment?: string,
): Promise<SlackUploadResult> {
  try {
    // Step 1: アップロードURL取得
    const urlParams = new URLSearchParams({
      filename: fileName,
      length: String(csvBuffer.byteLength),
    })
    const urlResponse = await fetch(
      `https://slack.com/api/files.getUploadURLExternal?${urlParams}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${botToken}` },
      },
    )
    const urlResult = (await urlResponse.json()) as GetUploadUrlResponse

    if (!urlResult.ok || !urlResult.upload_url || !urlResult.file_id) {
      console.error("Slack getUploadURLExternal error:", urlResult.error)
      return { success: false, error: urlResult.error ?? "Failed to get upload URL" }
    }

    // Step 2: ファイルアップロード
    const uploadResponse = await fetch(urlResult.upload_url, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new Uint8Array(csvBuffer),
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("Slack file upload error:", errorText)
      return { success: false, error: `Upload failed: ${uploadResponse.status}` }
    }

    // Step 3: ファイルをチャンネルに投稿
    const completePayload: Record<string, unknown> = {
      files: [{ id: urlResult.file_id, title: fileName }],
      channel_id: channelId,
    }
    if (initialComment) {
      completePayload.initial_comment = initialComment
    }

    const completeResponse = await fetch("https://slack.com/api/files.completeUploadExternal", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(completePayload),
    })
    const completeResult = (await completeResponse.json()) as CompleteUploadResponse

    if (!completeResult.ok) {
      console.error("Slack completeUploadExternal error:", completeResult.error)
      return { success: false, error: completeResult.error }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to upload CSV to Slack:", error)
    return { success: false, error: String(error) }
  }
}
