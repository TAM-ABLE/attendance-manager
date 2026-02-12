import type { SupabaseClient } from "@supabase/supabase-js"
import { DatabaseError } from "./attendance"

export class ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAllUsers() {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, name, email, employee_number, role")
      .order("employee_number", { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  async findAllUsersForSelect() {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, name, employee_number")
      .neq("role", "admin")
      .order("employee_number", { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  async findById(userId: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, name, employee_number")
      .eq("id", userId)
      .single()

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  async findMaxEmployeeNumber(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("employee_number")
      .like("employee_number", "A-%")
      .order("employee_number", { ascending: false })
      .limit(1)

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data.length > 0 ? data[0].employee_number : null
  }
}
