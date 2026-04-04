"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { serviceReminders as mockReminders } from "@/lib/mock-data";
import type { ServiceReminder, ReminderStatus } from "@/types";

interface ReminderStore {
  reminders: ServiceReminder[];
  addReminder: (reminder: ServiceReminder) => void;
  addReminders: (reminders: ServiceReminder[]) => void;
  updateReminder: (id: string, updates: Partial<ServiceReminder>) => void;
  deleteReminder: (id: string) => void;
  generateHighEndReminders: (params: {
    jobCardId: string;
    serviceName: string;
    serviceDate: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    vehicleId: string;
    vehicleRegNumber: string;
    vehicleMakeModel: string;
    intervalMonths: number[];
  }) => void;
}

function getReminderStatus(dueDate: string): ReminderStatus {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < -7) return "OVERDUE";
  if (diffDays < 0) return "DUE";
  return "UPCOMING";
}

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: mockReminders,

      addReminder: (reminder) =>
        set((state) => ({ reminders: [...state.reminders, reminder] })),

      addReminders: (newReminders) =>
        set((state) => ({ reminders: [...state.reminders, ...newReminders] })),

      updateReminder: (id, updates) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      deleteReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),

      generateHighEndReminders: (params) => {
        const base = new Date(params.serviceDate);
        const newReminders: ServiceReminder[] = params.intervalMonths.map(
          (months, idx) => {
            const dueDate = new Date(base);
            dueDate.setMonth(dueDate.getMonth() + months);
            const dueDateStr = dueDate.toISOString().split("T")[0];

            const yearLabel = months >= 12 ? `${months / 12}yr` : `${months}mo`;

            return {
              id: `rem-auto-${Date.now()}-${idx}`,
              vehicleId: params.vehicleId,
              vehicleRegNumber: params.vehicleRegNumber,
              vehicleMakeModel: params.vehicleMakeModel,
              customerId: params.customerId,
              customerName: params.customerName,
              customerPhone: params.customerPhone,
              type: "PPF_MAINTENANCE" as const,
              frequency: "CUSTOM" as const,
              dueDate: dueDateStr,
              lastServiceDate: params.serviceDate,
              lastJobCardId: params.jobCardId,
              status: getReminderStatus(dueDateStr),
              isHighEndService: true,
              totalDurationMonths: params.intervalMonths[params.intervalMonths.length - 1],
              intervalMonths: months,
              notes: `${params.serviceName} maintenance — ${yearLabel} follow-up`,
              whatsappSent: false,
            };
          }
        );

        set((state) => ({ reminders: [...state.reminders, ...newReminders] }));
      },
    }),
    { name: "prime-detailers-reminders", version: 2 }
  )
);
