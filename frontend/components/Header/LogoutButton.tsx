"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/auth";

type LogoutButtonProps = {
    className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        await logoutAction();
        router.push("/login");
        router.refresh();
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className={className}
            onClick={handleLogout}
        >
            ログアウト
        </Button>
    );
}
