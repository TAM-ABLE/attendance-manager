// backend/lib/formatters.ts
// 共通フォーマットユーティリティ

import { calculateSessionsTotals } from '@attendance-manager/shared/lib/calculation';
import type { Database } from '../src/types/supabase';
import type { WorkSession } from '@attendance-manager/shared/types/Attendance';

// 共通の型定義: DBから取得した勤怠レコード（ネスト付き）
export type DbAttendanceRecord = Database['public']['Tables']['attendance_records']['Row'] & {
    work_sessions: Array<
        Database['public']['Tables']['work_sessions']['Row'] & {
            breaks: Database['public']['Tables']['breaks']['Row'][];
        }
    >;
};

// APIレスポンス用の型
export interface FormattedAttendanceRecord {
    date: string;
    sessions: {
        id: string;
        clockIn: number | null;
        clockOut: number | null;
        breaks: {
            id: string;
            start: number | null;
            end: number | null;
        }[];
    }[];
    workTotalMs: number;
    breakTotalMs: number;
}

/**
 * DBの勤怠レコードをAPIレスポンス形式に変換
 * snake_case → camelCase、ISO文字列 → タイムスタンプ
 */
export function formatAttendanceRecord(record: DbAttendanceRecord): FormattedAttendanceRecord {
    // DBレコード → WorkSession形式に変換
    const sessions: WorkSession[] = record.work_sessions.map((s) => ({
        id: s.id,
        clockIn: s.clock_in ? new Date(s.clock_in).getTime() : null,
        clockOut: s.clock_out ? new Date(s.clock_out).getTime() : null,
        breaks: s.breaks.map((b) => ({
            id: b.id,
            start: b.break_start ? new Date(b.break_start).getTime() : null,
            end: b.break_end ? new Date(b.break_end).getTime() : null,
        })),
    }));

    // 共通の計算関数を使用
    const { workTotalMs, breakTotalMs } = calculateSessionsTotals(sessions);

    return {
        date: record.date,
        sessions,
        workTotalMs,
        breakTotalMs,
    };
}
