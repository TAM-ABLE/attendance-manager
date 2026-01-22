import { createOpenAPIHono } from "../../../lib/openapi-hono"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"
import breaksRouter from "./breaks"
// backend/src/routes/attendance/index.ts
import clockRouter from "./clock"
import queriesRouter from "./queries"

const attendanceRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// Clock operations: /attendance/clock-in, /attendance/clock-out
attendanceRouter.route("/", clockRouter)

// Break operations: /attendance/breaks/start, /attendance/breaks/end
attendanceRouter.route("/breaks", breaksRouter)

// Query operations: /attendance/today, /attendance/month, /attendance/week/total
attendanceRouter.route("/", queriesRouter)

export default attendanceRouter
