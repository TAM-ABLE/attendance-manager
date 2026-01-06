// backend/src/routes/auth/index.ts
import { Env } from "../../types/env";
import loginRouter from "./login";
import registerRouter from "./register";
import logoutRouter from "./logout";
import meRouter from "./me";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const auth = createOpenAPIHono<{ Bindings: Env }>();

// CORS はグローバル設定（src/index.ts）で処理

auth.route("/login", loginRouter);
auth.route("/register", registerRouter);
auth.route("/logout", logoutRouter);
auth.route("/me", meRouter);

export default auth;
