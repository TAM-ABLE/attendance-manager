import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"
import usersRouter from "./users"

const adminRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

adminRouter.route("/users", usersRouter)

export default adminRouter
