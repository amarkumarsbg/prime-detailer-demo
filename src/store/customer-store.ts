"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customers as mockCustomers } from "@/lib/mock-data";
import type { Customer } from "@/types";

interface CustomerStore {
  customers: Customer[];
  /** Returns false if another customer already uses this phone (last 10 digits). */
  addCustomer: (customer: Customer) => boolean;
  /** Returns false if updates.phone is already used by another customer. */
  updateCustomer: (id: string, updates: Partial<Customer>) => boolean;
  findByPhone: (phone: string) => Customer | undefined;
  findByEmail: (email: string) => Customer | undefined;
  findByReferralCode: (code: string) => Customer | undefined;
  creditWallet: (customerId: string, amount: number) => void;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: mockCustomers,

      addCustomer: (customer) => {
        const dup = get().findByPhone(customer.phone);
        if (dup) return false;
        set((state) => ({ customers: [customer, ...state.customers] }));
        return true;
      },

      updateCustomer: (id, updates) => {
        if (updates.phone !== undefined) {
          const other = get().findByPhone(updates.phone);
          if (other && other.id !== id) return false;
        }
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
        return true;
      },

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
