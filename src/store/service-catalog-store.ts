"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { serviceCatalog as seedCatalog } from "@/lib/mock-data/services";
import type { ServiceCatalogItem } from "@/types";

interface ServiceCatalogState {
  catalog: ServiceCatalogItem[];
  setCatalog: (updater: (prev: ServiceCatalogItem[]) => ServiceCatalogItem[]) => void;
}

function mergeDurationFromSeed(catalog: ServiceCatalogItem[]): ServiceCatalogItem[] {
  const seedById = new Map(seedCatalog.map((s) => [s.id, s]));
  return catalog.map((c) => {
    const seed = seedById.get(c.id);
    if (!seed) return c;
    return {
      ...c,
      durationMinutes: c.durationMinutes ?? seed.durationMinutes,
      maxDurationMinutes: c.maxDurationMinutes ?? seed.maxDurationMinutes,
    };
  });
}

export const useServiceCatalogStore = create<ServiceCatalogState>()(
  persist(
    (set) => ({
      catalog: [...seedCatalog],
      setCatalog: (updater) => set((state) => ({ catalog: updater(state.catalog) })),
    }),
    {
      name: "prime-detailer-service-catalog-v1",
      version: 2,
      migrate: (persisted, version) => {
        const p = persisted as ServiceCatalogState | undefined;
        if (!p?.catalog || version >= 2) return p as ServiceCatalogState;
        return { ...p, catalog: mergeDurationFromSeed(p.catalog) };
      },
    }
  )
);
