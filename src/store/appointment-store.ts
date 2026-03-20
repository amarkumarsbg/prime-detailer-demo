"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { appointments as mockAppointments } from "@/lib/mock-data";
import type { Appointment } from "@/types";

interface AppointmentStore {
  appointments: Appointment[];
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
}

export const useAppointmentStore = create<AppointmentStore>()(
  persist(
    (set) => ({
      appointments: mockAppointments,

      updateAppointment: (id, updates) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
    }),
    { name: "prime-detailers-appointments" }
  )
);
