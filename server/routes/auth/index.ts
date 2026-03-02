import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { Env } from "../../types/env"
import loginRouter from "./login"
import logoutRouter from "./logout"
import meRouter from "./me"
import setPasswordRouter from "./set-password"

const auth = createOpenAPIHono<{ Bindings: Env }>()

auth.route("/login", loginRouter)
auth.route("/set-password", setPasswordRouter)
auth.route("/logout", logoutRouter)
auth.route("/me", meRouter)

export default auth
