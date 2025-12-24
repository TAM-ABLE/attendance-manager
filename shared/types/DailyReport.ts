// shared/types/DailyReport.ts

export type TaskType = 'planned' | 'actual';

export interface DailyReportTask {
    id: string;
    taskType: TaskType;
    taskName: string;
    hours: number | null;
    sortOrder: number;
}

export interface DailyReport {
    id: string;
    userId: string;
    date: string; // 'YYYY-MM-DD'
    summary: string | null;
    issues: string | null;
    notes: string | null;
    submittedAt: number | null; // timestamp（NULLなら下書き、値があれば提出済）
    plannedTasks: DailyReportTask[];
    actualTasks: DailyReportTask[];
    createdAt: number;
    updatedAt: number;
}

// 日報一覧用の軽量型
export interface DailyReportListItem {
    id: string;
    userId: string;
    userName: string;
    employeeNumber: string;
    date: string;
    submittedAt: number | null; // NULLなら下書き、値があれば提出済
    plannedTaskCount: number;
    actualTaskCount: number;
}

// ユーザー選択用
export interface UserForSelect {
    id: string;
    name: string;
    employeeNumber: string;
}
