import { handle } from "hono/vercel"
import app from "@/server/app"

const handler = handle(app)

export const GET = handler
export const POST = handler
export const PUT = handler
export const DELETE = handler
