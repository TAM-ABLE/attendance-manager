import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"
import breaksRouter from "./breaks"
import clockRouter from "./clock"
import closeMonthRouter from "./close-month"
import queriesRouter from "./queries"
import sessionsRouter from "./sessions"

const attendanceRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

attendanceRouter.route("/", clockRouter)
attendanceRouter.route("/breaks", breaksRouter)
attendanceRouter.route("/", queriesRouter)
attendanceRouter.route("/", sessionsRouter)
attendanceRouter.route("/", closeMonthRouter)

export default attendanceRouter
