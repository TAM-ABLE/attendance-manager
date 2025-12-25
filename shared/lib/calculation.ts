// shared/lib/calculation.ts
// フロントエンド・バックエンド共通の計算ロジック

import type { WorkSession, Break } from '../types/Attendance';

/**
 * セッション内の休憩時間を計算 (ms)
 * @param breaks 休憩一覧
 * @param options.now 進行中の休憩終了時刻として使う現在時刻（省略時は終了していない休憩は0として扱う）
 */
export function calculateBreakMs(breaks: Break[], options?: { now?: number }): number {
    return breaks.reduce((sum, b) => {
        if (!b.start) return sum;
        // 終了していない休憩
        if (!b.end) {
            // now が指定されていれば進行中として計算
            if (options?.now) {
                return sum + (options.now - b.start);
            }
            return sum;
        }
        return sum + (b.end - b.start);
    }, 0);
}

/**
 * 完了済みセッションの勤務時間・休憩時間を計算
 * @param session WorkSession
 * @returns { workMs, breakMs }
 */
export function calculateCompletedSession(session: WorkSession): { workMs: number; breakMs: number } {
    if (!session.clockIn || !session.clockOut) {
        return { workMs: 0, breakMs: 0 };
    }

    const breakMs = calculateBreakMs(session.breaks);
    const workMs = Math.max(0, (session.clockOut - session.clockIn) - breakMs);

    return { workMs, breakMs };
}

/**
 * 進行中セッションの勤務時間・休憩時間を計算（リアルタイム表示用）
 * @param session WorkSession
 * @param now 現在時刻 (ms)
 * @param onBreak 現在休憩中かどうか
 * @returns { workMs, breakMs }
 */
export function calculateActiveSession(
    session: WorkSession,
    now: number,
    onBreak: boolean
): { workMs: number; breakMs: number } {
    if (!session.clockIn) {
        return { workMs: 0, breakMs: 0 };
    }

    const totalMs = now - session.clockIn;

    const breakMs = session.breaks.reduce((sum, b) => {
        if (!b.start) return sum;
        const breakEnd = b.end != null ? b.end : (onBreak ? now : b.start);
        return sum + (breakEnd - b.start);
    }, 0);

    const workMs = Math.max(0, totalMs - breakMs);

    return { workMs, breakMs };
}

/**
 * 複数セッションの合計を計算
 * @param sessions WorkSession[]
 * @returns { workTotalMs, breakTotalMs }
 */
export function calculateSessionsTotals(sessions: WorkSession[]): { workTotalMs: number; breakTotalMs: number } {
    let workTotalMs = 0;
    let breakTotalMs = 0;

    for (const session of sessions) {
        const { workMs, breakMs } = calculateCompletedSession(session);
        workTotalMs += workMs;
        breakTotalMs += breakMs;
    }

    return { workTotalMs, breakTotalMs };
}
