"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { serviceCatalog as seedCatalog } from "@/lib/mock-data/services";
import type { ServiceCatalogItem } from "@/types";

interface ServiceCatalogState {
  catalog: ServiceCatalogItem[];
  setCatalog: (updater: (prev: ServiceCatalogItem[]) => ServiceCatalogItem[]) => void;
}

export const useServiceCatalogStore = create<ServiceCatalogState>()(
  persist(
    (set) => ({
      catalog: [...seedCatalog],
      setCatalog: (updater) => set((state) => ({ catalog: updater(state.catalog) })),
    }),
    { name: "prime-detailer-service-catalog-v1" }
  )
);
