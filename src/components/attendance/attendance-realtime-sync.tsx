"use client";

import { useEffect } from "react";
import { useAttendanceStore } from "@/store/attendance-store";

/** Polls the attendance API so phone punches show on the shop PC within ~2s. */
export function AttendanceRealtimeSync() {
  useEffect(() => {
    const sync = () => void useAttendanceStore.getState().sync();
    sync();
    const t = setInterval(sync, 2000);
    return () => clearInterval(t);
  }, []);

  return null;
}
