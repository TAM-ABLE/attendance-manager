import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"
import breaksRouter from "./breaks"
import clockRouter from "./clock"
import queriesRouter from "./queries"

const attendanceRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

attendanceRouter.route("/", clockRouter)
attendanceRouter.route("/breaks", breaksRouter)
attendanceRouter.route("/", queriesRouter)

export default attendanceRouter
