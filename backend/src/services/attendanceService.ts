import { sendSlackNotification } from './slackService'
import { formatTime } from '../utils/formatTime'

export const sendAttendanceNotification = async (
    name: string,
    action: 'clockIn' | 'clockOut' | 'breakStart' | 'breakEnd',
    env: { SLACK_WEBHOOK_URL: string }
) => {
    const time = formatTime(new Date())

    const actionMap = {
        clockIn: '出勤しました！',
        clockOut: '退勤しました！',
        breakStart: '休憩に入りました！',
        breakEnd: '休憩が終わりました！'
    }

    const text = `${name}\n ${time}\n${actionMap[action]}`
    await sendSlackNotification(text, env)
    return text
}