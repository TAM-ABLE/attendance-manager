// backend/lib/repositories/profile.ts
// プロフィールデータアクセス層

import type { SupabaseClient } from "@supabase/supabase-js"
import { DatabaseError } from "./attendance"

/**
 * プロフィールRepository
 */
export class ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  /**
   * 全ユーザーを取得（管理者用）
   */
  async findAllUsers() {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, name, email, employee_number")
      .order("employee_number", { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * 全ユーザーを取得（選択用：email なし）
   */
  async findAllUsersForSelect() {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id, name, employee_number")
      .order("employee_number", { ascending: true })

    if (error) {
      throw new DatabaseError(error.message)
    }

    return data
  }

  /**
   * ユーザーをIDで取得（選択用）
   */
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
}
