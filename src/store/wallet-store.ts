"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { walletTransactions as mockTransactions } from "@/lib/mock-data";
import type { WalletTransaction } from "@/types";

interface WalletStore {
  transactions: WalletTransaction[];
  addTransaction: (tx: WalletTransaction) => void;
  getByCustomer: (customerId: string) => WalletTransaction[];
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      transactions: mockTransactions,

      addTransaction: (tx) =>
        set((state) => ({ transactions: [tx, ...state.transactions] })),

      getByCustomer: (customerId) =>
        get()
          .transactions.filter((t) => t.customerId === customerId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }),
    { name: "prime-detailers-wallet" }
  )
);
