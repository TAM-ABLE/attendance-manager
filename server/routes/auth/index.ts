import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { Env } from "../../types/env"
import loginRouter from "./login"
import logoutRouter from "./logout"
import meRouter from "./me"
import registerRouter from "./register"

const auth = createOpenAPIHono<{ Bindings: Env }>()

auth.route("/login", loginRouter)
auth.route("/register", registerRouter)
auth.route("/logout", logoutRouter)
auth.route("/me", meRouter)

export default auth
