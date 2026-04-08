"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  businessName: string;
  /** Shown under business name on tax invoices */
  businessTagline: string;
  businessPhone: string;
  businessWhatsApp: string;
  businessEmail: string;
  businessAddress: string;
  businessWebsite: string;
  gstin: string;
  companyPan: string;
  bankName: string;
  bankBranch: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankUpi: string;
  referralRewardAmount: number;
  newCustomerDiscount: number;
  /** Helper on job card: suggested advance as % of estimate (high-end jobs only). */
  highEndAdvanceSuggestedPercent: number;
  setBusinessProfile: (
    profile: Partial<
      Pick<
        SettingsState,
        | "businessName"
        | "businessTagline"
        | "businessPhone"
        | "businessWhatsApp"
        | "businessEmail"
        | "businessAddress"
        | "businessWebsite"
        | "gstin"
        | "companyPan"
        | "bankName"
        | "bankBranch"
        | "bankAccountNumber"
        | "bankIfsc"
        | "bankUpi"
      >
    >
  ) => void;
  setReferralRewardAmount: (amount: number) => void;
  setNewCustomerDiscount: (amount: number) => void;
  setHighEndAdvanceSuggestedPercent: (percent: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      businessName: "Prime Detailers",
      businessTagline: "Car Wash & Detailing Studio",
      businessPhone: "+91-80-4123-4567",
      businessWhatsApp: "+91-80-4123-4567",
      businessEmail: "hello@primedetailers.in",
      businessAddress: "80 Feet Road, Koramangala 4th Block, Bengaluru 560034",
      businessWebsite: "www.primedetailers.com",
      gstin: "29AABCT1234F1ZP",
      companyPan: "[Your PAN]",
      bankName: "[Your Bank Name]",
      bankBranch: "[Branch Name]",
      bankAccountNumber: "[Account Number]",
      bankIfsc: "[IFSC Code]",
      bankUpi: "[UPI ID or Number]",
      referralRewardAmount: 500,
      newCustomerDiscount: 200,
      highEndAdvanceSuggestedPercent: 30,
      setBusinessProfile: (profile) => set((state) => ({ ...state, ...profile })),
      setReferralRewardAmount: (amount) => set({ referralRewardAmount: amount }),
      setNewCustomerDiscount: (amount) => set({ newCustomerDiscount: amount }),
      setHighEndAdvanceSuggestedPercent: (percent) =>
        set({ highEndAdvanceSuggestedPercent: Math.min(100, Math.max(0, percent)) }),
    }),
    { name: "prime-detailers-settings" }
  )
);
