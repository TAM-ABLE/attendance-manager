// backend/src/routes/admin/index.ts
import usersRouter from "./users";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const adminRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

// User and attendance operations: /admin/users/*
adminRouter.route("/users", usersRouter);

export default adminRouter;
