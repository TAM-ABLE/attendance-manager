// components/Header/index.tsx
// Server Component

import { Gauge } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AuthUser } from "@/lib/auth/server";
import { NavLinks } from "./NavLinks";
import { LogoutButton } from "./LogoutButton";
import { MobileMenu } from "./MobileMenu";

type HeaderProps = {
    user: AuthUser | null;
};

export function Header({ user }: HeaderProps) {
    // ログインしていない場合はHeaderを非表示
    if (!user) return null;

    const isAdmin = user.role === "admin";
    const initials = user.name.charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* 左側ロゴ */}
                <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    <span className="font-medium">勤怠管理システム</span>
                </div>

                {/* モバイルメニュー (Client Component) */}
                <MobileMenu
                    userName={user.name}
                    userEmail={user.email}
                    isAdmin={isAdmin}
                />

                {/* デスクトップナビゲーション (Client Component) */}
                <NavLinks isAdmin={isAdmin} />

                {/* ユーザー情報 (Server Component) */}
                <div className="hidden md:flex items-center gap-3 ml-4 border-l pl-4">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-white">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p>{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {/* ログアウトボタン (Client Component) */}
                    <LogoutButton className="ml-4" />
                </div>
            </div>
        </header>
    );
}
