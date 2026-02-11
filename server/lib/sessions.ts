import type { z } from "@hono/zod-openapi"
import type { sessionUpdateSchema } from "./openapi-schemas"
import type { createRepos } from "./repositories"

type SessionInput = z.infer<typeof sessionUpdateSchema>
type Repos = ReturnType<typeof createRepos>

/**
 * セッションのバリデーション
 * エラーがあればメッセージを返し、なければ null を返す
 */
export function validateSessions(sessions: SessionInput[]): string | null {
  for (const s of sessions) {
    if (s.clockIn == null) continue
    if (s.clockOut && s.clockOut < s.clockIn) {
      return "Clock out time must be after clock in time"
    }
    for (const br of s.breaks || []) {
      if (!br.start) continue
      if (br.end && br.end < br.start) {
        return "Break end time must be after break start time"
      }
      if (br.start < s.clockIn) {
        return "Break start time must be after clock in time"
      }
      if (s.clockOut && br.end && br.end > s.clockOut) {
        return "Break end time must be before clock out time"
      }
    }
  }
  return null
}

/**
 * 指定ユーザー・日付のセッションを全置換する
 * 旧セッション削除 → バリデーション → 新セッション挿入
 */
export async function replaceSessions(
  repos: Repos,
  userId: string,
  date: string,
  sessions: SessionInput[],
): Promise<{ error: string | null }> {
  const { id: attendanceId } = await repos.attendance.findOrCreateRecord(userId, date)

  const oldSessionIds = await repos.workSession.getSessionIdsByAttendanceId(attendanceId)
  if (oldSessionIds.length > 0) {
    await repos.break.deleteBySessionIds(oldSessionIds)
    await repos.workSession.deleteByIds(oldSessionIds)
  }

  const validSessions = sessions.filter((s) => s.clockIn != null)

  const validationError = validateSessions(validSessions)
  if (validationError) {
    return { error: validationError }
  }

  if (validSessions.length > 0) {
    const insertedSessions = await repos.workSession.insertMultiple(
      attendanceId,
      validSessions.map((s) => ({
        clockIn: new Date(s.clockIn!).toISOString(),
        clockOut: s.clockOut ? new Date(s.clockOut).toISOString() : null,
      })),
    )

    const breakInserts: { sessionId: string; breakStart: string; breakEnd: string | null }[] = []
    for (let i = 0; i < validSessions.length; i++) {
      const sessionId = insertedSessions[i].id
      for (const br of validSessions[i].breaks || []) {
        if (!br.start) continue
        breakInserts.push({
          sessionId,
          breakStart: new Date(br.start).toISOString(),
          breakEnd: br.end ? new Date(br.end).toISOString() : null,
        })
      }
    }

    if (breakInserts.length > 0) {
      await repos.break.insertMultiple(breakInserts)
    }
  }

  return { error: null }
}
