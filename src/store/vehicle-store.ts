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
