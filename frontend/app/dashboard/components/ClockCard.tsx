"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function ClockCard() {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        const update = () => setCurrentTime(new Date());
        update(); // 初回すぐ反映
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!currentTime) {
        // SSR時は null → 何も描画しない（Hydrationエラー防止）
        return null;
    }

    return (
        <Card>
            <CardContent className="pt-6 text-center">
                <div className="text-4xl mb-2">
                    {currentTime.toLocaleTimeString("ja-JP")}
                </div>
                <p className="text-muted-foreground">
                    {currentTime.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "long",
                    })}
                </p>
            </CardContent>
        </Card>
    );
}