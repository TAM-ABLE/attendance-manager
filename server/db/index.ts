import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

let cachedDb: ReturnType<typeof drizzle<typeof schema>> | null = null
let cachedUrl: string | null = null

export function getDb(databaseUrl: string) {
  if (cachedDb && cachedUrl === databaseUrl) return cachedDb
  const client = postgres(databaseUrl, { prepare: false })
  cachedDb = drizzle(client, { schema })
  cachedUrl = databaseUrl
  return cachedDb
}

export type Db = ReturnType<typeof getDb>
