import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"
import userAttendanceRouter from "./user-attendance"
import userCrudRouter from "./user-crud"
import userEmailsRouter from "./user-emails"

const adminRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

adminRouter.route("/users", userCrudRouter)
adminRouter.route("/users", userEmailsRouter)
adminRouter.route("/users", userAttendanceRouter)

export default adminRouter
