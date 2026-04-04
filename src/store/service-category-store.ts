"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ServiceCategoryRecord } from "@/types";

const SEED: ServiceCategoryRecord[] = [
  { id: "cat-wash", name: "Car Wash", slug: "wash", order: 0, bikeOnly: false },
  { id: "cat-interior", name: "Interior Cleaning", slug: "interior", order: 1, bikeOnly: false },
  { id: "cat-exterior", name: "Exterior Beautification", slug: "exterior", order: 2, bikeOnly: false },
  { id: "cat-coating", name: "Ceramic Coating", slug: "coating", order: 3, bikeOnly: false },
  { id: "cat-makeover", name: "Car Makeover", slug: "makeover", order: 4, bikeOnly: false },
];

interface ServiceCategoryState {
  categories: ServiceCategoryRecord[];
  setCategories: (u: (prev: ServiceCategoryRecord[]) => ServiceCategoryRecord[]) => void;
  upsert: (row: ServiceCategoryRecord) => void;
  remove: (id: string) => void;
}

export const useServiceCategoryStore = create<ServiceCategoryState>()(
  persist(
    (set) => ({
      categories: [...SEED],

      setCategories: (u) => set((s) => ({ categories: u(s.categories) })),

      upsert: (row) => {
        set((s) => {
          const i = s.categories.findIndex((c) => c.id === row.id);
          if (i === -1) return { categories: [...s.categories, row].sort((a, b) => a.order - b.order) };
          const next = [...s.categories];
          next[i] = row;
          return { categories: next.sort((a, b) => a.order - b.order) };
        });
      },

      remove: (id) => {
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
      },
    }),
    { name: "prime-detailer-service-categories-v1" }
  )
);
