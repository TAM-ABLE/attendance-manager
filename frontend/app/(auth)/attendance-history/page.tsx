// app/(auth)/attendance-history/page.tsx

import { AttendanceHistoryClient } from "./components/AttendanceHistoryClient";

export default function AttendanceHistoryPage() {
    // 認証チェックは(auth)/layout.tsxで実施済み
    return <AttendanceHistoryClient />;
}
