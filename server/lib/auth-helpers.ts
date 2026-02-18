import * as jose from "jose"

export interface JwtPayloadResult {
  sub: string
  role: "admin" | "user"
  name: string
  email: string
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayloadResult> {
  const secretKey = new TextEncoder().encode(secret)
  const { payload } = await jose.jwtVerify(token, secretKey, {
    algorithms: ["HS256"],
  })

  const sub = payload.sub
  if (!sub) throw new Error("Missing sub claim")

  const userMetadata = payload.user_metadata as { role?: string; name?: string } | undefined
  const role = (userMetadata?.role as "admin" | "user") ?? "user"
  const name = (userMetadata?.name as string) ?? ""
  const email = (payload.email as string) ?? ""

  return { sub, role, name, email }
}

interface GoTrueTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: GoTrueUser
}

interface GoTrueUser {
  id: string
  email: string
  user_metadata: Record<string, unknown>
}

export async function signInWithPassword(
  supabaseUrl: string,
  apiKey: string,
  email: string,
  password: string,
): Promise<GoTrueTokenResponse> {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const error = (await res.json()) as { error_description?: string; msg?: string }
    throw new Error(error.error_description || error.msg || "Login failed")
  }

  return res.json() as Promise<GoTrueTokenResponse>
}

export async function adminUpdateUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  params: { password?: string; user_metadata?: Record<string, unknown> },
): Promise<void> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const error = (await res.json()) as { msg?: string }
    throw new Error(error.msg || "User update failed")
  }
}

export async function adminCreateUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  params: {
    email: string
    password: string
    email_confirm: boolean
    user_metadata: Record<string, unknown>
  },
): Promise<GoTrueUser> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const error = (await res.json()) as { msg?: string }
    throw new Error(error.msg || "User creation failed")
  }

  return res.json() as Promise<GoTrueUser>
}
