"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { staff as seedStaff } from "@/lib/mock-data/staff";
import type { User, UserRole } from "@/types";

function normalizePin(pin: string): string {
  return pin.trim().replace(/\D/g, "");
}

function isValidPinDigits(digits: string): boolean {
  return digits.length >= 4 && digits.length <= 8;
}

export type UpdatePinResult =
  | { ok: true }
  | { ok: false; error: "DUPLICATE" | "INVALID" };

interface AddStaffInput {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
}

export type UpdateStaffResult =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "DUPLICATE_EMAIL" };

interface StaffStoreState {
  staff: User[];
  addStaff: (input: AddStaffInput) => void;
  updateStaff: (
    id: string,
    updates: Partial<
      Pick<User, "name" | "email" | "phone" | "role" | "branchId" | "isActive">
    >
  ) => UpdateStaffResult;
  updateAttendancePin: (staffId: string, pin: string) => UpdatePinResult;
  findByAttendancePin: (pin: string) => User | undefined;
  resetToSeed: () => void;
}

function generateRandomAttendancePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function nextStaffId(existing: User[]): string {
  const nums = existing
    .map((s) => {
      const m = /^usr-(\d+)$/.exec(s.id);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length ? Math.max(...nums) : 0;
  return `usr-${String(max + 1).padStart(3, "0")}`;
}

function allocateAttendancePin(getStaff: () => User[]): string {
  for (let i = 0; i < 80; i++) {
    const p = generateRandomAttendancePin();
    if (!getStaff().some((s) => s.attendancePin === p)) return p;
  }
  return String(1000 + getStaff().length);
}

export const useStaffStore = create<StaffStoreState>()(
  persist(
    (set, get) => ({
      staff: [...seedStaff],

      resetToSeed: () => set({ staff: [...seedStaff] }),

      addStaff: (input) => {
        const list = get().staff;
        const newMember: User = {
          id: nextStaffId(list),
          name: input.name.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          role: input.role,
          branchId: input.branchId,
          isActive: true,
          attendancePin: allocateAttendancePin(() => get().staff),
        };
        set({ staff: [newMember, ...list] });
      },

      updateStaff: (id, updates) => {
        const list = get().staff;
        const current = list.find((s) => s.id === id);
        if (!current) return { ok: false, error: "NOT_FOUND" };

        const next: User = {
          ...current,
          ...updates,
          name: updates.name !== undefined ? updates.name.trim() : current.name,
          email: updates.email !== undefined ? updates.email.trim() : current.email,
          phone: updates.phone !== undefined ? updates.phone.trim() : current.phone,
          role: updates.role ?? current.role,
          branchId: updates.branchId ?? current.branchId,
          isActive: updates.isActive ?? current.isActive,
        };

        if (
          list.some(
            (s) =>
              s.id !== id &&
              s.email.toLowerCase() === next.email.toLowerCase()
          )
        ) {
          return { ok: false, error: "DUPLICATE_EMAIL" };
        }

        set({
          staff: list.map((s) => (s.id === id ? next : s)),
        });
        return { ok: true };
      },

      updateAttendancePin: (staffId, pin) => {
        const digits = normalizePin(pin);
        if (!isValidPinDigits(digits)) {
          return { ok: false, error: "INVALID" };
        }
        const list = get().staff;
        if (
          list.some(
            (s) => s.id !== staffId && s.attendancePin === digits
          )
        ) {
          return { ok: false, error: "DUPLICATE" };
        }
        set({
          staff: list.map((s) =>
            s.id === staffId ? { ...s, attendancePin: digits } : s
          ),
        });
        return { ok: true };
      },

      findByAttendancePin: (pin) => {
        const digits = normalizePin(pin);
        if (!digits) return undefined;
        return get().staff.find(
          (s) => s.attendancePin === digits && s.isActive
        );
      },
    }),
    {
      name: "prime-detailers-staff",
      version: 1,
    }
  )
);

export { generateRandomAttendancePin };
