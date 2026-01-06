"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Menu,
    X,
    LayoutDashboard,
    History,
    Users,
    FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

// Headerコンポーネント
export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, isAdmin, logout } = useAuth();

    // ログインしていない場合はHeaderを非表示
    if (!isAuthenticated || !user) return null;

    const navigation = [
        { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
        { href: "/attendance-history", label: "勤怠履歴", icon: History },
        ...(isAdmin ? [
            { href: "/report-list", label: "日報一覧", icon: FileText },
            { href: "/admin", label: "管理者", icon: Users },
        ] : []),
    ];

    const getInitials = (name: string | null | undefined) =>
        name ? name.charAt(0).toUpperCase() : "U";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* 左側ロゴ */}
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span className="font-medium">勤怠管理システム</span>
                </div>

                {/* モバイル用メニュー */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </Button>

                {/* デスクトップナビゲーション */}
                <nav className="hidden md:flex gap-2 ml-auto">
                    {navigation.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Button
                                key={href}
                                asChild
                                variant={isActive ? "default" : "ghost"}
                                className={`gap-2 ${isActive ? "bg-primary text-white" : ""}`}
                            >
                                <Link href={href}>
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            </Button>
                        );
                    })}
                </nav>

                {/* ユーザー情報 */}
                <div className="hidden md:flex items-center gap-3 ml-4 border-l pl-4">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-white">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p>{user.name ?? "未ログイン"}</p>
                        <p className="text-xs text-muted-foreground">
                            {user.email ?? ""}
                        </p>
                    </div>
                    {/* ログアウトボタン */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        onClick={async () => {
                            await logout();
                            router.refresh();
                            router.push("/login");
                        }}
                    >
                        ログアウト
                    </Button>
                </div>
            </div>

            {/* モバイルナビゲーション */}
            {isOpen && (
                <nav className="md:hidden border-t bg-white p-4 space-y-2">
                    {navigation.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Button
                                key={href}
                                asChild
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-2 ${isActive ? "bg-primary text-white" : ""
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Link href={href}>
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            </Button>
                        );
                    })}
                    {/* モバイル用ログアウトボタン */}
                    <div className="pt-2 border-t mt-2">
                        <div className="flex items-center gap-2 px-2 py-2 mb-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white text-sm">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                                setIsOpen(false);
                                await logout();
                                router.refresh();
                                router.push("/login");
                            }}
                        >
                            ログアウト
                        </Button>
                    </div>
                </nav>
            )}
        </header>
    );
}