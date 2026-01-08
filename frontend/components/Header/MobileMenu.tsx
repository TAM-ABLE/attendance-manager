"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LayoutDashboard, History, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/app/actions/auth";

type MobileMenuProps = {
    userName: string;
    userEmail: string;
    isAdmin: boolean;
};

const navItems = [
    { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
    { href: "/attendance-history", label: "勤怠履歴", icon: History },
];

const adminNavItems = [
    { href: "/report-list", label: "日報一覧", icon: FileText },
    { href: "/admin", label: "管理者", icon: Users },
];

export function MobileMenu({ userName, userEmail, isAdmin }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const navigation = isAdmin ? [...navItems, ...adminNavItems] : navItems;

    const getInitials = (name: string) => name.charAt(0).toUpperCase();

    const handleLogout = async () => {
        setIsOpen(false);
        await logoutAction();
        router.push("/login");
        router.refresh();
    };

    return (
        <>
            {/* メニューボタン */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X /> : <Menu />}
            </Button>

            {/* モバイルナビゲーション */}
            {isOpen && (
                <nav className="absolute top-16 left-0 right-0 md:hidden border-t bg-white p-4 space-y-2 shadow-lg z-50">
                    {navigation.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <Button
                                key={href}
                                asChild
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-2 ${isActive ? "bg-primary text-white" : ""}`}
                                onClick={() => setIsOpen(false)}
                            >
                                <Link href={href}>
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </Link>
                            </Button>
                        );
                    })}

                    {/* ユーザー情報とログアウト */}
                    <div className="pt-2 border-t mt-2">
                        <div className="flex items-center gap-2 px-2 py-2 mb-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white text-sm">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                                <p className="font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground">{userEmail}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleLogout}
                        >
                            ログアウト
                        </Button>
                    </div>
                </nav>
            )}
        </>
    );
}
