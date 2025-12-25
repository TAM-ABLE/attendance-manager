"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthNavigatorProps {
    currentMonth: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
}

export function MonthNavigator({
    currentMonth,
    onPrevMonth,
    onNextMonth,
    onToday,
}: MonthNavigatorProps) {
    return (
        <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="outline" size="sm" onClick={onPrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button variant="outline" size="sm" onClick={onToday}>
                    <CalendarIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">今月</span>
                </Button>

                <Button variant="outline" size="sm" onClick={onNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <span className="ml-2 text-base sm:text-lg font-semibold whitespace-nowrap">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </span>
        </div>
    );
}
