// backend/lib/calculation.ts

interface DbBreak {
    break_start: string | null;
    break_end: string | null;
}

interface DbWorkSession {
    clock_in: string | null;
    clock_out: string | null;
    breaks: DbBreak[];
}

// 1セッションの休憩時間を計算 (ms)
export function calculateSessionBreakMs(session: DbWorkSession): number {
    return session.breaks.reduce((sum, b) => {
        if (!b.break_start || !b.break_end) return sum;
        const start = new Date(b.break_start).getTime();
        const end = new Date(b.break_end).getTime();
        return sum + (end - start);
    }, 0);
}

// 1セッションの勤務時間を計算 (ms) - 休憩時間を差し引く
export function calculateSessionWorkMs(session: DbWorkSession): number {
    if (!session.clock_in || !session.clock_out) return 0;

    const clockIn = new Date(session.clock_in).getTime();
    const clockOut = new Date(session.clock_out).getTime();
    const breakMs = calculateSessionBreakMs(session);

    return Math.max(0, (clockOut - clockIn) - breakMs);
}

// 1日の合計勤務時間と休憩時間を計算
export function calculateDayTotals(sessions: DbWorkSession[]): { workTotalMs: number; breakTotalMs: number } {
    let workTotalMs = 0;
    let breakTotalMs = 0;

    for (const session of sessions) {
        workTotalMs += calculateSessionWorkMs(session);
        breakTotalMs += calculateSessionBreakMs(session);
    }

    return { workTotalMs, breakTotalMs };
}
