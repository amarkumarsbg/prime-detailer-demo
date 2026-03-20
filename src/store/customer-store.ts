"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customers as mockCustomers } from "@/lib/mock-data";
import type { Customer } from "@/types";

interface CustomerStore {
  customers: Customer[];
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  findByPhone: (phone: string) => Customer | undefined;
  findByEmail: (email: string) => Customer | undefined;
  findByReferralCode: (code: string) => Customer | undefined;
  creditWallet: (customerId: string, amount: number) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: mockCustomers,

      addCustomer: (customer) =>
        set((state) => ({ customers: [customer, ...state.customers] })),

      updateCustomer: (id, updates) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      findByPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, "").slice(-10);
        if (cleaned.length !== 10) return undefined;
        return get().customers.find((c) => c.phone.replace(/\D/g, "").slice(-10) === cleaned);
      },

      findByEmail: (email) => {
        const norm = email.trim().toLowerCase();
        if (!norm) return undefined;
        return get().customers.find((c) => c.email?.trim().toLowerCase() === norm);
      },

      findByReferralCode: (code) => {
        const upper = code.trim().toUpperCase();
        return get().customers.find((c) => c.referralCode.toUpperCase() === upper);
      },

      creditWallet: (customerId, amount) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? { ...c, walletBalance: c.walletBalance + amount }
              : c
          ),
        })),
    }),
    { name: "prime-detailers-customers" }
  )
);
