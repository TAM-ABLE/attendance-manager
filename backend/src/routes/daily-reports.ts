// backend/src/routes/daily-reports.ts
import { Hono } from 'hono';
import { getSupabaseClient } from '../../lib/supabase';
import { Env } from '../types/env';
import { AuthVariables } from '../middleware/auth';
import {
    DailyReport,
    DailyReportListItem,
    DailyReportTask,
    UserForSelect,
} from '../../../shared/types/DailyReport';

const dailyReportsRouter = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// ユーザー一覧取得（ユーザー選択用）
dailyReportsRouter.get('/users', async (c) => {
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase
        .from('users')
        .select('id, name, employee_number')
        .order('employee_number', { ascending: true });

    if (error) {
        console.error(error);
        return c.json({ error: error.message }, 500);
    }

    const users: UserForSelect[] = data.map((user) => ({
        id: user.id,
        name: user.name,
        employeeNumber: user.employee_number,
    }));

    return c.json({ users });
});

// 特定ユーザーの月別日報一覧取得
// GET /daily-reports/user/:userId/month/:yearMonth
// yearMonth: 'YYYY-MM' 形式
dailyReportsRouter.get('/user/:userId/month/:yearMonth', async (c) => {
    const { userId, yearMonth } = c.req.param();

    // yearMonth のバリデーション
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
        return c.json({ error: 'Invalid yearMonth format. Use YYYY-MM' }, 400);
    }

    const [year, month] = yearMonth.split('-').map(Number);
    const monthStart = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const monthEnd = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    const supabase = getSupabaseClient(c.env);

    // ユーザー情報を取得
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, employee_number')
        .eq('id', userId)
        .single();

    if (userError) {
        console.error(userError);
        return c.json({ error: 'User not found' }, 404);
    }

    // 日報一覧を取得
    const { data: reports, error: reportsError } = await supabase
        .from('daily_reports')
        .select(`
            id,
            user_id,
            date,
            submitted_at,
            daily_report_tasks (
                id,
                task_type
            )
        `)
        .eq('user_id', userId)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: true });

    if (reportsError) {
        console.error(reportsError);
        return c.json({ error: reportsError.message }, 500);
    }

    const reportList: DailyReportListItem[] = (reports || []).map((report) => {
        const tasks = report.daily_report_tasks || [];
        const plannedCount = tasks.filter((t: { task_type: string }) => t.task_type === 'planned').length;
        const actualCount = tasks.filter((t: { task_type: string }) => t.task_type === 'actual').length;

        return {
            id: report.id,
            userId: report.user_id,
            userName: userData.name,
            employeeNumber: userData.employee_number,
            date: report.date,
            submittedAt: report.submitted_at ? new Date(report.submitted_at).getTime() : null,
            plannedTaskCount: plannedCount,
            actualTaskCount: actualCount,
        };
    });

    return c.json({
        user: {
            id: userData.id,
            name: userData.name,
            employeeNumber: userData.employee_number,
        },
        yearMonth,
        reports: reportList,
    });
});

// 日報詳細取得
// GET /daily-reports/:id
dailyReportsRouter.get('/:id', async (c) => {
    const { id } = c.req.param();
    const supabase = getSupabaseClient(c.env);

    // 日報とタスクを取得
    const { data: report, error: reportError } = await supabase
        .from('daily_reports')
        .select(`
            id,
            user_id,
            date,
            summary,
            issues,
            notes,
            submitted_at,
            created_at,
            updated_at,
            daily_report_tasks (
                id,
                task_type,
                task_name,
                hours,
                sort_order
            )
        `)
        .eq('id', id)
        .single();

    if (reportError) {
        console.error(reportError);
        return c.json({ error: 'Daily report not found' }, 404);
    }

    const tasks = report.daily_report_tasks || [];
    const plannedTasks: DailyReportTask[] = tasks
        .filter((t: { task_type: string }) => t.task_type === 'planned')
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((t: { id: string; task_type: string; task_name: string; hours: number | null; sort_order: number }) => ({
            id: t.id,
            taskType: t.task_type as 'planned',
            taskName: t.task_name,
            hours: t.hours,
            sortOrder: t.sort_order,
        }));

    const actualTasks: DailyReportTask[] = tasks
        .filter((t: { task_type: string }) => t.task_type === 'actual')
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((t: { id: string; task_type: string; task_name: string; hours: number | null; sort_order: number }) => ({
            id: t.id,
            taskType: t.task_type as 'actual',
            taskName: t.task_name,
            hours: t.hours,
            sortOrder: t.sort_order,
        }));

    const dailyReport: DailyReport = {
        id: report.id,
        userId: report.user_id,
        date: report.date,
        summary: report.summary,
        issues: report.issues,
        notes: report.notes,
        submittedAt: report.submitted_at ? new Date(report.submitted_at).getTime() : null,
        plannedTasks,
        actualTasks,
        createdAt: new Date(report.created_at).getTime(),
        updatedAt: new Date(report.updated_at).getTime(),
    };

    return c.json({ report: dailyReport });
});

export default dailyReportsRouter;
