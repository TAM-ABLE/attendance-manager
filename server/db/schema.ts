import { relations } from "drizzle-orm"
import { date, integer, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core"

// ===== profiles =====
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  employeeNumber: text("employee_number").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

// ===== attendance_records =====
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique("attendance_records_user_date_unique").on(table.userId, table.date)],
)

// ===== work_sessions =====
export const workSessions = pgTable("work_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  attendanceId: uuid("attendance_id")
    .notNull()
    .references(() => attendanceRecords.id, { onDelete: "cascade" }),
  clockIn: timestamp("clock_in", { withTimezone: true, mode: "string" }).notNull(),
  clockOut: timestamp("clock_out", { withTimezone: true, mode: "string" }),
  slackClockInTs: text("slack_clock_in_ts"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

// ===== breaks =====
export const breaks = pgTable("breaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => workSessions.id, { onDelete: "cascade" }),
  breakStart: timestamp("break_start", { withTimezone: true, mode: "string" }).notNull(),
  breakEnd: timestamp("break_end", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

// ===== daily_reports =====
export const dailyReports = pgTable("daily_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  summary: text("summary"),
  issues: text("issues"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

// ===== daily_report_tasks =====
export const dailyReportTasks = pgTable("daily_report_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  dailyReportId: uuid("daily_report_id")
    .notNull()
    .references(() => dailyReports.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(),
  taskName: text("task_name").notNull(),
  hours: numeric("hours", { precision: 4, scale: 2 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
})

// ===== Relations =====

export const profilesRelations = relations(profiles, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
  dailyReports: many(dailyReports),
}))

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [attendanceRecords.userId],
    references: [profiles.id],
  }),
  workSessions: many(workSessions),
}))

export const workSessionsRelations = relations(workSessions, ({ one, many }) => ({
  attendanceRecord: one(attendanceRecords, {
    fields: [workSessions.attendanceId],
    references: [attendanceRecords.id],
  }),
  breaks: many(breaks),
}))

export const breaksRelations = relations(breaks, ({ one }) => ({
  workSession: one(workSessions, {
    fields: [breaks.sessionId],
    references: [workSessions.id],
  }),
}))

export const dailyReportsRelations = relations(dailyReports, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [dailyReports.userId],
    references: [profiles.id],
  }),
  tasks: many(dailyReportTasks),
}))

export const dailyReportTasksRelations = relations(dailyReportTasks, ({ one }) => ({
  dailyReport: one(dailyReports, {
    fields: [dailyReportTasks.dailyReportId],
    references: [dailyReports.id],
  }),
}))
