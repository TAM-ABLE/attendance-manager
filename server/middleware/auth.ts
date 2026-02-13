import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import { verifyJwt } from "../lib/auth-helpers"
import { forbiddenError, unauthorizedError } from "../lib/errors"
import type { Env } from "../types/env"

export type JwtPayload = {
  sub: string
  role: "admin" | "user"
}

export type AuthVariables = {
  jwtPayload: JwtPayload
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}

export const authMiddleware = async (
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next,
) => {
  const authHeader = c.req.header("Authorization")
  let token = extractBearerToken(authHeader)
  if (!token) {
    token = getCookie(c, "accessToken") ?? null
  }
  if (!token) {
    return unauthorizedError(c, "Not authenticated")
  }

  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET)

    c.set("jwtPayload", {
      sub: payload.sub,
      role: payload.role,
    })

    await next()
  } catch (err) {
    console.error("Auth error:", err)
    return unauthorizedError(c, "Invalid token")
  }
}

export const adminMiddleware = async (
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next,
) => {
  const payload = c.get("jwtPayload")

  if (payload.role !== "admin") {
    return forbiddenError(c, "Admin access required")
  }

  await next()
}
