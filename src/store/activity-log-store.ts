"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { activityLogs as seedLogs } from "@/lib/mock-data";
import type { ActivityLog } from "@/types";

interface ActivityLogStore {
  logs: ActivityLog[];
  addLog: (entry: ActivityLog) => void;
}

export const useActivityLogStore = create<ActivityLogStore>()(
  persist(
    (set) => ({
      logs: seedLogs,
      addLog: (entry) =>
        set((s) => ({
          logs: [entry, ...s.logs],
        })),
    }),
    { name: "prime-detailers-activity-log" }
  )
);
