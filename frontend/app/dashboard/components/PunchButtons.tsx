"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, LogOut, LogIn, Pause, Play } from "lucide-react";

interface Props {
    onClockIn: () => void;
    onClockOut: () => void;

    onBreakStart: () => void;
    onBreakEnd: () => void;

    onBreak: boolean;
    isWorking: boolean;
    sessionCount: number;
}

export function PunchButtons({
    onClockIn,
    onClockOut,
    onBreakStart,
    onBreakEnd,
    onBreak,
    isWorking,
    sessionCount
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
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
                    {/* 出勤ボタン → ダイアログ表示のみ */}
                    <Button
                        onClick={onClockIn}
                        disabled={isWorking || sessionCount >= 3}
                        size="lg"
                        className={`h-20 sm:h-24 flex-col gap-2 w-full sm:w-[300px] md:w-[400px] text-lg sm:text-xl font-semibold ${!isWorking && !onBreak
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-gray-300 text-gray-500"
                            }`}
                    >
                        <LogIn className="h-8 w-8 sm:h-12 sm:w-12" />
                        出勤
                    </Button>

                    {/* 退勤ボタン → ダイアログ表示のみ */}
                    <Button
                        onClick={onClockOut}
                        disabled={!isWorking || onBreak}
                        size="lg"
                        className={`h-20 sm:h-24 flex-col gap-2 w-full sm:w-[300px] md:w-[400px] text-lg sm:text-xl font-semibold ${isWorking && !onBreak
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-gray-200 text-gray-400"
                            }`}
                    >
                        <LogOut className="h-8 w-8 sm:h-12 sm:w-12" />
                        退勤
                    </Button>
                </div>

                {/* 2行目: 休憩ボタン（中央配置） */}
                <div className="flex justify-center px-4 sm:px-0">
                    {/* 休憩開始・終了は即実行 - 中央に配置 */}
                    {!onBreak ? (
                        <Button
                            onClick={() => onBreakStart()}
                            disabled={!isWorking}
                            size="lg"
                            className={`h-20 sm:h-24 flex-col gap-2 w-full sm:w-[300px] md:w-[400px] text-lg sm:text-xl font-semibold ${isWorking
                                ? "bg-gray-900 text-white hover:bg-gray-800"
                                : "bg-gray-200 text-gray-400"
                                }`}
                        >
                            <Coffee className="h-8 w-8 sm:h-12 sm:w-12" />
                            休憩開始
                        </Button>
                    ) : (
                        <Button
                            onClick={() => onBreakEnd()}
                            size="lg"
                            className="h-20 sm:h-24 flex-col gap-2 w-full sm:w-[300px] md:w-[400px] text-lg sm:text-xl font-semibold bg-gray-900 text-white hover:bg-gray-800"
                        >
                            <Play className="h-8 w-8 sm:h-12 sm:w-12" />
                            休憩終了
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}