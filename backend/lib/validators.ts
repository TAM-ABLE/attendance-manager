// backend/lib/validators.ts
// 共通バリデーションユーティリティ

type YearMonthSuccess = {
    valid: true;
    year: number;
    month: number;
    start: string;
    end: string;
};

type YearMonthError = {
    valid: false;
    error: string;
};

export type YearMonthResult = YearMonthSuccess | YearMonthError;

/**
 * YYYY-MM形式の文字列をパースし、月の開始日・終了日を計算
 * @param yearMonth - "YYYY-MM" 形式の文字列
 * @returns バリデーション結果（成功時は年月と日付範囲、失敗時はエラーメッセージ）
 */
export function parseYearMonth(yearMonth: string): YearMonthResult {
    // YYYY-MM形式チェック
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        return { valid: false, error: 'Invalid yearMonth format. Use YYYY-MM' };
    }

    const [year, month] = yearMonth.split('-').map(Number);

    // 月の範囲チェック
    if (month < 1 || month > 12) {
        return { valid: false, error: 'Invalid month. Must be 01-12' };
    }

    // 月の開始日・終了日を計算
    const start = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    return { valid: true, year, month, start, end };
}
