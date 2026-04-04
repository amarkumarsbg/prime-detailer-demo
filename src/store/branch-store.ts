"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { branches as seedBranches } from "@/lib/mock-data/branches";
import type { Branch } from "@/types";

function nextBranchId(list: Branch[]): string {
  const nums = list
    .map((b) => {
      const m = /^br-(\d+)$/.exec(b.id);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `br-${String(next).padStart(3, "0")}`;
}

interface BranchStore {
  branches: Branch[];
  addBranch: (input: Omit<Branch, "id"> & { id?: string }) => Branch;
  updateBranch: (id: string, updates: Partial<Omit<Branch, "id">>) => boolean;
  /** Soft-delete */
  deactivateBranch: (id: string) => void;
  resetToSeed: () => void;
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set, get) => ({
      branches: seedBranches.map((b) => ({ ...b })),

      resetToSeed: () => set({ branches: seedBranches.map((b) => ({ ...b })) }),

      addBranch: (input) => {
        const list = get().branches;
        const id = input.id ?? nextBranchId(list);
        const code =
          input.code?.trim() || `SITE-${id.replace(/^br-/, "").toUpperCase()}`;
        const branch: Branch = {
          id,
          name: input.name.trim(),
          address: input.address.trim(),
          phone: input.phone.trim(),
          isActive: input.isActive ?? true,
          qrCodeId: input.qrCodeId ?? `qr-${id}`,
          code,
          city: input.city?.trim() ?? "",
          state: input.state?.trim() ?? "",
          pincode: input.pincode?.trim() ?? "",
          email: input.email?.trim() || undefined,
          managerName: input.managerName?.trim() || undefined,
          managerPhone: input.managerPhone?.trim() || undefined,
        };
        set({ branches: [...list, branch] });
        return branch;
      },

      updateBranch: (id, updates) => {
        const list = get().branches;
        const i = list.findIndex((b) => b.id === id);
        if (i < 0) return false;
        const next: Branch = { ...list[i], ...updates };
        if (updates.name !== undefined) next.name = updates.name.trim();
        if (updates.address !== undefined) next.address = updates.address.trim();
        if (updates.phone !== undefined) next.phone = updates.phone.trim();
        if (updates.code !== undefined) next.code = updates.code.trim();
        if (updates.city !== undefined) next.city = updates.city.trim();
        if (updates.state !== undefined) next.state = updates.state.trim();
        if (updates.pincode !== undefined) next.pincode = updates.pincode.trim();
        if (updates.email !== undefined) next.email = updates.email.trim() || undefined;
        if (updates.managerName !== undefined) next.managerName = updates.managerName.trim() || undefined;
        if (updates.managerPhone !== undefined) next.managerPhone = updates.managerPhone.trim() || undefined;
        set({
          branches: list.map((b) => (b.id === id ? next : b)),
        });
        return true;
      },

      deactivateBranch: (id) => {
        set({
          branches: get().branches.map((b) =>
            b.id === id ? { ...b, isActive: false } : b
          ),
        });
      },
    }),
    { name: "prime-detailers-branches", version: 2 }
  )
);
