"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, FileText, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header({ currentUser }: { currentUser: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navigation = [
        { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
        { href: "/attendance-history", label: "勤怠履歴", icon: History },
        { href: "/report-form", label: "日報投稿", icon: FileText },
        ...(currentUser?.isAdmin ? [{ href: "/admin", label: "管理者", icon: Users }] : []),
    ];

    const getInitials = (name: string) => name.charAt(0);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    <span className="font-medium">勤怠管理システム</span>
                </div>

                {/* モバイル */}
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
                        const isActive = pathname === href; // 現在のURLと比較
                        return (
                            <Button
                                key={href}
                                asChild
                                variant={isActive ? "default" : "ghost"} // 選択中なら強調表示
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

                {/* ユーザー */}
                <div className="hidden md:flex items-center gap-3 ml-4 border-l pl-4">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-white">
                            {getInitials(currentUser?.name || "U")}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p>{currentUser?.name}</p>
                        <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                    </div>
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
                </nav>
            )}
        </header>
    );
}