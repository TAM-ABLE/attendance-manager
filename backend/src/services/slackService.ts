// backend/src/services/slackService.ts

export const sendSlackNotification = async (text: string, env: { SLACK_WEBHOOK_URL: string }) => {
    await fetch(env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })
}