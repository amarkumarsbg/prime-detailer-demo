"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { quotations as seedQuotations } from "@/lib/mock-data";
import type { Quotation } from "@/types";

interface QuotationStore {
  quotations: Quotation[];
  addQuotation: (q: Quotation) => void;
  updateQuotation: (id: string, patch: Partial<Quotation>) => void;
  getNextQuotationNumber: () => string;
}

export const useQuotationStore = create<QuotationStore>()(
  persist(
    (set, get) => ({
      quotations: seedQuotations,

      addQuotation: (q) =>
        set((s) => ({ quotations: [q, ...s.quotations] })),

      updateQuotation: (id, patch) =>
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, ...patch, updatedAt: new Date().toISOString() } : q
          ),
        })),

      getNextQuotationNumber: () => {
        const all = get().quotations;
        const max = all.reduce((m, q) => {
          const match = q.quotationNumber.match(/QUO-\d{4}-(\d+)/);
          return match ? Math.max(m, parseInt(match[1], 10)) : m;
        }, 0);
        return `QUO-2026-${String(max + 1).padStart(4, "0")}`;
      },
    }),
    { name: "prime-detailers-quotations" }
  )
);
