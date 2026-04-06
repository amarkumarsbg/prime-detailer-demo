"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { vehicles as mockVehicles } from "@/lib/mock-data";
import type { Vehicle } from "@/types";

interface VehicleStore {
  vehicles: Vehicle[];
  setVehicles: (value: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => void;
}

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set) => ({
      vehicles: mockVehicles,
      setVehicles: (value) =>
        set((state) => ({
          vehicles: typeof value === "function" ? value(state.vehicles) : value,
        })),
    }),
    { name: "prime-detailers-vehicles" }
  )
);

/** Other tabs/windows update localStorage when vehicles change — pull latest into this session. */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "prime-detailers-vehicles" && e.newValue != null) {
      void useVehicleStore.persist.rehydrate();
    }
  });
}
