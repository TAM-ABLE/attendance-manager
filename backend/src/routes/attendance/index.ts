// backend/src/routes/attendance/index.ts
import clockRouter from "./clock";
import breaksRouter from "./breaks";
import queriesRouter from "./queries";
import { Env } from "../../types/env";
import { AuthVariables } from "../../middleware/auth";
import { createOpenAPIHono } from "../../../lib/openapi-hono";

const attendanceRouter = createOpenAPIHono<{ Bindings: Env; Variables: AuthVariables }>();

// Clock operations: /attendance/clock-in, /attendance/clock-out
attendanceRouter.route("/", clockRouter);

// Break operations: /attendance/breaks/start, /attendance/breaks/end
attendanceRouter.route("/breaks", breaksRouter);

// Query operations: /attendance/today, /attendance/month, /attendance/week/total
attendanceRouter.route("/", queriesRouter);

export default attendanceRouter;
