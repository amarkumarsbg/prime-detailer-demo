"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  gstin: string;
  referralRewardAmount: number;
  newCustomerDiscount: number;
  setBusinessProfile: (profile: Partial<Pick<SettingsState, "businessName" | "businessPhone" | "businessEmail" | "businessAddress" | "gstin">>) => void;
  setReferralRewardAmount: (amount: number) => void;
  setNewCustomerDiscount: (amount: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      businessName: "Prime Detailers",
      businessPhone: "+91-80-4123-4567",
      businessEmail: "hello@primedetailers.in",
      businessAddress: "80 Feet Road, Koramangala 4th Block, Bengaluru 560034",
      gstin: "29AABCT1234F1ZP",
      referralRewardAmount: 500,
      newCustomerDiscount: 200,
      setBusinessProfile: (profile) => set((state) => ({ ...state, ...profile })),
      setReferralRewardAmount: (amount) => set({ referralRewardAmount: amount }),
      setNewCustomerDiscount: (amount) => set({ newCustomerDiscount: amount }),
    }),
    { name: "prime-detailers-settings" }
  )
);
