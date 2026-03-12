import * as jose from "jose"

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return authHeader.slice(7)
}

export interface JwtPayloadResult {
  sub: string
  role: "admin" | "user"
  name: string
  email: string
}

// JWKSキャッシュ
let jwksCache: jose.JWTVerifyGetKey | null = null
let jwksCacheUrl: string | null = null

export async function verifyJwt(
  token: string,
  secret: string,
  supabaseUrl?: string,
): Promise<JwtPayloadResult> {
  // JWTヘッダーのアルゴリズムを確認
  const header = jose.decodeProtectedHeader(token)

  let payload: jose.JWTPayload

  if (header.alg === "ES256" && supabaseUrl) {
    // ES256の場合はJWKSを使用
    const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`
    if (!jwksCache || jwksCacheUrl !== jwksUrl) {
      jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl))
      jwksCacheUrl = jwksUrl
    }
    const result = await jose.jwtVerify(token, jwksCache)
    payload = result.payload
  } else {
    // HS256/HS384/HS512の場合はシークレットを使用
    const secretKey = new TextEncoder().encode(secret)
    const result = await jose.jwtVerify(token, secretKey, {
      algorithms: ["HS256", "HS384", "HS512"],
    })
    payload = result.payload
  }

  const sub = payload.sub
  if (!sub) throw new Error("Missing sub claim")

  const userMetadata = payload.user_metadata as { role?: string; name?: string } | undefined
  const role = (userMetadata?.role as "admin" | "user") ?? "user"
  const name = (userMetadata?.name as string) ?? ""
  const email = (payload.email as string) ?? ""

  return { sub, role, name, email }
}

export class GoTrueError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "GoTrueError"
  }
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

async function goTrueAdminRequest<T = void>(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string,
  method: string,
  defaultErrorMessage: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  }
  const init: RequestInit = { method, headers }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
    init.body = JSON.stringify(body)
  }

  const res = await fetch(`${supabaseUrl}/auth/v1${path}`, init)

  if (!res.ok) {
    const error = (await res.json()) as {
      msg?: string
      message?: string
      error_description?: string
    }
    const msg = error.msg || error.message || error.error_description || defaultErrorMessage
    throw new GoTrueError(msg, res.status)
  }

  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export async function adminUpdateUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  params: { email?: string; password?: string; user_metadata?: Record<string, unknown> },
): Promise<void> {
  await goTrueAdminRequest(
    supabaseUrl,
    serviceRoleKey,
    `/admin/users/${userId}`,
    "PUT",
    "User update failed",
    params,
  )
}

interface GoTrueAdminUser {
  id: string
  email: string
  user_metadata: Record<string, unknown>
}

interface GoTrueAdminListResponse {
  users: GoTrueAdminUser[]
}

export async function goTrueAdminListUsers(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<GoTrueAdminUser[]> {
  const data = await goTrueAdminRequest<GoTrueAdminListResponse>(
    supabaseUrl,
    serviceRoleKey,
    "/admin/users",
    "GET",
    "Failed to list users",
  )
  return data.users
}

interface GenerateLinkResponse {
  action_link: string
  id: string
  email: string
  user_metadata: Record<string, unknown>
}

export async function adminDeleteUser(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
): Promise<void> {
  await goTrueAdminRequest(
    supabaseUrl,
    serviceRoleKey,
    `/admin/users/${userId}`,
    "DELETE",
    "Failed to delete user",
  )
}

export async function generateLink(
  supabaseUrl: string,
  serviceRoleKey: string,
  params: {
    type: "invite" | "recovery"
    email: string
    data?: Record<string, unknown>
    redirect_to?: string
  },
): Promise<GenerateLinkResponse> {
  return goTrueAdminRequest<GenerateLinkResponse>(
    supabaseUrl,
    serviceRoleKey,
    "/admin/generate_link",
    "POST",
    "Failed to generate link",
    params,
  )
}
