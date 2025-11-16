//dashbaord/hooks/useClockDialogs.ts
"use client";

import { useState } from "react";

export function useClockDialogs() {
    const [showClockInDialog, setClockIn] = useState(false);
    const [showClockOutDialog, setClockOut] = useState(false);

    return {
        showClockInDialog,
        showClockOutDialog,
        openClockIn: () => setClockIn(true),
        openClockOut: () => setClockOut(true),
        closeDialogs: () => {
            setClockIn(false);
            setClockOut(false);
        }
    };
}