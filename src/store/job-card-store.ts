"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jobCards as mockJobCards } from "@/lib/mock-data";
import type { JobCard } from "@/types";

interface JobCardStore {
  jobCards: JobCard[];
  addJobCard: (jobCard: JobCard) => void;
  updateJobCard: (id: string, updates: Partial<JobCard>) => void;
  deleteJobCard: (id: string) => void;
  getNextJobNumber: () => string;
}

export const useJobCardStore = create<JobCardStore>()(
  persist(
    (set, get) => ({
      jobCards: mockJobCards,

      addJobCard: (jobCard) =>
        set((state) => ({ jobCards: [jobCard, ...state.jobCards] })),

      updateJobCard: (id, updates) =>
        set((state) => ({
          jobCards: state.jobCards.map((jc) =>
            jc.id === id ? { ...jc, ...updates } : jc
          ),
        })),

      deleteJobCard: (id) =>
        set((state) => ({
          jobCards: state.jobCards.filter((jc) => jc.id !== id),
        })),

      getNextJobNumber: () => {
        const all = get().jobCards;
        const maxNum = all.reduce((max, jc) => {
          const match = jc.jobNumber.match(/JC-\d{4}-(\d+)/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        return `JC-2026-${String(maxNum + 1).padStart(4, "0")}`;
      },
    }),
    {
      name: "prime-detailers-job-cards",
      version: 2,
      migrate: () => ({
        jobCards: mockJobCards,
      }),
    }
  )
);
