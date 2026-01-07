// dashboard/page.tsx

import { getUser } from "@/lib/auth/server";
import { DashboardClient } from "./components/DashboardClient";

export default async function DashboardPage() {
    // 認証チェックは(auth)/layout.tsxで実施済み
    const user = (await getUser())!;

    return <DashboardClient user={user} />;
}
