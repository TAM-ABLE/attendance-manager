import { createOpenAPIHono } from "../../lib/openapi-hono"
import type { Env } from "../../types/env"
import firstLoginRouter from "./first-login"
import loginRouter from "./login"
import logoutRouter from "./logout"
import meRouter from "./me"

const auth = createOpenAPIHono<{ Bindings: Env }>()

auth.route("/login", loginRouter)
auth.route("/first-login", firstLoginRouter)
auth.route("/logout", logoutRouter)
auth.route("/me", meRouter)

export default auth
