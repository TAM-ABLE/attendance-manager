"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, LogOut, LogIn, Pause, Play } from "lucide-react";
import { useSession } from "next-auth/react";

interface Props {
    onClockIn: (name: string) => void;
    onClockOut: (name: string) => void;
    onBreakStart: (name: string) => void;
    onBreakEnd: (name: string) => void;
    onBreak: boolean;
    isWorking: boolean;
}

export function PunchButtons({
    onClockIn,
    onClockOut,
    onBreakStart,
    onBreakEnd,
    onBreak,
    isWorking,
}: Props) {
    const { data: session } = useSession();
    const name = session?.user?.name || "不明なユーザー";

    return (
        <div className="grid grid-cols-2 gap-4">
            <Button
                onClick={() => onClockIn(name)}
                disabled={isWorking}
                size="lg"
                className="h-24 flex-col gap-2"
            >
                <LogIn className="h-6 w-6" />
                出勤
            </Button>

            <Button
                onClick={() => onClockOut(name)}
                disabled={!isWorking}
                variant="destructive"
                size="lg"
                className="h-24 flex-col gap-2"
            >
                <LogOut className="h-6 w-6" />
                退勤
            </Button>

            {!onBreak ? (
                <Button
                    onClick={() => onBreakStart(name)}
                    disabled={!isWorking}
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col gap-2"
                >
                    <Coffee className="h-6 w-6" />
                    休憩開始
                </Button>
            ) : (
                <Button
                    onClick={() => onBreakEnd(name)}
                    size="lg"
                    variant="outline"
                    className="h-24 flex-col gap-2"
                >
                    <Play className="h-6 w-6" />
                    休憩終了
                </Button>
            )}

            <div className="flex items-center justify-center">
                {isWorking && !onBreak && (
                    <Badge variant="default" className="px-4 py-2">
                        <Clock className="h-4 w-4 mr-2" />勤務中
                    </Badge>
                )}
                {onBreak && (
                    <Badge variant="secondary" className="px-4 py-2">
                        <Pause className="h-4 w-4 mr-2" />休憩中
                    </Badge>
                )}
            </div>
        </div>
    );
}