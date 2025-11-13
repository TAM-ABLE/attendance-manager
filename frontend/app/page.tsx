import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function App() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")
  else redirect("/login")
}