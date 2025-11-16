export type TaskItem = {
    task: string
    hours: string
}

export type ClockInPayload = {
    name: string
    plannedTasks: TaskItem[]
}

export type ClockOutPayload = {
    name: string
    actualTasks: TaskItem[]
    summary: string
    issues: string
    notes: string
}