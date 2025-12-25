// backend/src/routes/auth/index.ts
import { cors } from "hono/cors";
import { Env } from "../../types/env";
import loginRouter from "./login";
import registerRouter from "./register";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const auth = createOpenAPIHono<{ Bindings: Env }>();

auth.use("*", cors());

auth.route("/login", loginRouter);
auth.route("/register", registerRouter);

export default auth;
