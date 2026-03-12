import type { Context, Next } from "hono"
import { getCookie } from "hono/cookie"
import { verifyJwt } from "../lib/auth-helpers"
import { forbiddenError, unauthorizedError } from "../lib/errors"
import type { Env } from "../types/env"

export type JwtPayload = {
  sub: string
  role: "admin" | "user"
  name: string
  email: string
}

export type AuthVariables = {
  jwtPayload: JwtPayload
}

export function extractToken(
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
): string | null {
  return getCookie(c, "accessToken") ?? null
}

export const authMiddleware = async (
  c: Context<{ Bindings: Env; Variables: AuthVariables }>,
  next: Next,
) => {
  const token = extractToken(c)
  if (!token) {
    return unauthorizedError(c, "Not authenticated")
  }

  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET, c.env.SUPABASE_URL)

    c.set("jwtPayload", {
      sub: payload.sub,
      role: payload.role,
      name: payload.name,
      email: payload.email,
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

  if (!payload) {
    return unauthorizedError(c, "Not authenticated")
  }

  if (payload.role !== "admin") {
    return forbiddenError(c, "Admin access required")
  }

  await next()
}
