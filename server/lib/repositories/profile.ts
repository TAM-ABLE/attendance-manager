import { asc, desc, eq, like, ne } from "drizzle-orm"
import type { Db } from "../../db"
import { profiles } from "../../db/schema"
import { DatabaseError } from "./attendance"

export class ProfileRepository {
  constructor(private db: Db) {}

  async findAllUsers() {
    return this.db
      .select({
        id: profiles.id,
        name: profiles.name,
        email: profiles.email,
        employee_number: profiles.employeeNumber,
        role: profiles.role,
      })
      .from(profiles)
      .orderBy(asc(profiles.employeeNumber))
  }

  async findAllUsersForSelect() {
    return this.db
      .select({
        id: profiles.id,
        name: profiles.name,
        employee_number: profiles.employeeNumber,
      })
      .from(profiles)
      .where(ne(profiles.role, "admin"))
      .orderBy(asc(profiles.employeeNumber))
  }

  async findById(userId: string) {
    const result = await this.db
      .select({
        id: profiles.id,
        name: profiles.name,
        employee_number: profiles.employeeNumber,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    if (!result[0]) {
      throw new DatabaseError("Profile not found")
    }

    return result[0]
  }

  async findMaxEmployeeNumber(): Promise<string | null> {
    const result = await this.db
      .select({ employee_number: profiles.employeeNumber })
      .from(profiles)
      .where(like(profiles.employeeNumber, "A-%"))
      .orderBy(desc(profiles.employeeNumber))
      .limit(1)

    return result[0]?.employee_number ?? null
  }
}
