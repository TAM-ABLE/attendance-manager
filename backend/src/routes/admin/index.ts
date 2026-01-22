import { createOpenAPIHono } from "../../../lib/openapi-hono"
import type { AuthVariables } from "../../middleware/auth"
import type { Env } from "../../types/env"
// backend/src/routes/admin/index.ts
import usersRouter from "./users"

const adminRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>()

// User and attendance operations: /admin/users/*
adminRouter.route("/users", usersRouter)

export default adminRouter
