"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, LogOut, LogIn, Pause, Play } from "lucide-react";
import { useSession } from "next-auth/react";

interface Props {
    // 出勤・退勤は「ダイアログを開くだけ」
    onClockIn: () => void;
    onClockOut: () => void;

    onBreakStart: () => void;
    onBreakEnd: () => void;

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

    return (
        <div className="space-y-4">
            {/* 状態バッジ - 上部に配置 */}
            <div className="flex justify-center">
                {!isWorking && !onBreak && (
                    <Badge variant="outline" className="px-4 py-2 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        未出勤
                    </Badge>
                )}
                {isWorking && !onBreak && (
                    <Badge variant="default" className="px-4 py-2 text-sm">
                        <Clock className="h-4 w-4 mr-2" />
                        出勤中
                    </Badge>
                )}
                {onBreak && (
                    <Badge variant="secondary" className="px-4 py-2 text-sm">
                        <Pause className="h-4 w-4 mr-2" />
                        休憩中
                    </Badge>
                )}
            </div>

            {/* ボタンエリア */}
            <div className="space-y-4">
                {/* 1行目: 出勤・退勤ボタン - 中央配置 */}
                <div className="flex justify-center gap-4">
                    {/* 出勤ボタン → ダイアログ表示のみ */}
                    <Button
                        onClick={onClockIn}
                        disabled={isWorking}
                        size="lg"
                        className="h-24 flex-col gap-2 w-[400px] text-xl font-semibold"
                    >
                        <LogIn className="h-12 w-12" />
                        出勤
                    </Button>

                    {/* 退勤ボタン → ダイアログ表示のみ */}
                    <Button
                        onClick={onClockOut}
                        disabled={!isWorking}
                        variant="destructive"
                        size="lg"
                        className="h-24 flex-col gap-2 w-[400px] text-xl font-semibold"
                    >
                        <LogOut className="h-12 w-12" />
                        退勤
                    </Button>
                </div>

                {/* 2行目: 休憩ボタン（中央配置） */}
                <div className="flex justify-center">
                    {/* 休憩開始・終了は即実行 - 中央に配置 */}
                    {!onBreak ? (
                        <Button
                            onClick={() => onBreakStart()}
                            disabled={!isWorking}
                            size="lg"
                            variant="outline"
                            className="h-24 flex-col gap-2 w-[400px] text-xl font-semibold"
                        >
                            <Coffee className="h-12 w-12" />
                            休憩開始
                        </Button>
                    ) : (
                        <Button
                            onClick={() => onBreakEnd()}
                            size="lg"
                            variant="outline"
                            className="h-24 flex-col gap-2 w-[400px] text-xl font-semibold"
                        >
                            <Play className="h-12 w-12" />
                            休憩終了
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}