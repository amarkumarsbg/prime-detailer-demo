"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CashBankAccountType = "cash" | "unlinked" | "bank";

export interface CashBankBankMeta {
  accountNumber: string;
  holderName: string;
  ifsc: string;
  bankName: string;
  branchName: string;
  upiId?: string;
}

export interface CashBankAccount {
  id: string;
  type: CashBankAccountType;
  displayName: string;
  balance: number;
  openingBalanceDate?: string;
  accountNumberDisplay?: string;
  bankMeta?: CashBankBankMeta;
}

export type CashBankTxnRowType =
  | "OPENING"
  | "ADJUST_ADD"
  | "ADJUST_REDUCE"
  | "TRANSFER_OUT"
  | "TRANSFER_IN";

export interface CashBankTransaction {
  id: string;
  accountId: string;
  date: string;
  rowType: CashBankTxnRowType;
  txnNo?: string;
  party?: string;
  mode?: string;
  paid?: number;
  received?: number;
  balanceAfter: number;
  notes?: string;
}

const SEED_ACCOUNTS: CashBankAccount[] = [
  {
    id: "acc-cash",
    type: "cash",
    displayName: "Cash in hand",
    balance: 255671.83,
    openingBalanceDate: "2025-09-19T00:00:00.000Z",
  },
  {
    id: "acc-unlinked",
    type: "unlinked",
    displayName: "Unlinked Transactions",
    balance: 113345,
    accountNumberDisplay: "—",
    openingBalanceDate: "2026-03-08T00:00:00.000Z",
  },
  {
    id: "acc-bank-1",
    type: "bank",
    displayName: "SAMRIDDHI AGENCIES",
    balance: 1_000_000,
    accountNumberDisplay: "99996390096666",
    openingBalanceDate: "2025-09-19T00:00:00.000Z",
    bankMeta: {
      accountNumber: "99996390096666",
      holderName: "SAMRIDDHI AGENCIES",
      ifsc: "HDFC0000453",
      bankName: "HDFC Bank",
      branchName: "HDFC Bank, JHANSI",
    },
  },
  {
    id: "acc-bank-2",
    type: "bank",
    displayName: "HDFC",
    balance: 383216,
    accountNumberDisplay: "50200088207180",
    openingBalanceDate: "2025-01-01T00:00:00.000Z",
    bankMeta: {
      accountNumber: "50200088207180",
      holderName: "Prime Detailers",
      ifsc: "HDFC000075",
      bankName: "HDFC",
      branchName: "Old Madras Road",
    },
  },
  {
    id: "acc-bank-3",
    type: "bank",
    displayName: "HDFC BANK",
    balance: 208703.22,
    accountNumberDisplay: "—",
    openingBalanceDate: "2025-06-01T00:00:00.000Z",
    bankMeta: {
      accountNumber: "50200000000000",
      holderName: "Prime Detailers Pvt Ltd",
      ifsc: "HDFC0000123",
      bankName: "HDFC Bank",
      branchName: "Bengaluru",
    },
  },
];

export interface CashBankStore {
  accounts: CashBankAccount[];
  transactions: CashBankTransaction[];
  setAccounts: (v: CashBankAccount[] | ((prev: CashBankAccount[]) => CashBankAccount[])) => void;
  setTransactions: (
    v: CashBankTransaction[] | ((prev: CashBankTransaction[]) => CashBankTransaction[])
  ) => void;
  addBankAccount: (account: Omit<CashBankAccount, "id">) => void;
  updateBankAccount: (id: string, patch: Partial<CashBankAccount>) => void;
  removeBankAccount: (id: string) => void;
  adjustBalance: (input: {
    accountId: string;
    amount: number;
    add: boolean;
    dateIso: string;
    remarks?: string;
  }) => void;
  transfer: (input: {
    fromId: string;
    toId: string;
    amount: number;
    dateIso: string;
    remarks?: string;
  }) => boolean;
}

export const useCashBankStore = create<CashBankStore>()(
  persist(
    (set, get) => ({
      accounts: SEED_ACCOUNTS,
      transactions: [],
      setAccounts: (value) =>
        set((s) => ({
          accounts: typeof value === "function" ? value(s.accounts) : value,
        })),
      setTransactions: (value) =>
        set((s) => ({
          transactions: typeof value === "function" ? value(s.transactions) : value,
        })),
      addBankAccount: (account) => {
        const id = `acc-bank-${Date.now()}`;
        const row: CashBankAccount = { ...account, id, type: "bank" };
        set((s) => ({
          accounts: [row, ...s.accounts],
        }));
      },
      updateBankAccount: (id, patch) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
      },
      removeBankAccount: (id) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
        }));
      },
      adjustBalance: ({ accountId, amount, add, dateIso, remarks }) => {
        if (amount <= 0) return;
        const state = get();
        const acc = state.accounts.find((a) => a.id === accountId);
        if (!acc) return;
        const delta = add ? amount : -amount;
        const newBal = Math.round((acc.balance + delta) * 100) / 100;
        const id = `txn-${Date.now()}`;
        const rowType: CashBankTxnRowType = add ? "ADJUST_ADD" : "ADJUST_REDUCE";
        const t: CashBankTransaction = {
          id,
          accountId,
          date: dateIso,
          rowType,
          party: "Balance adjustment",
          mode: "Manual",
          paid: add ? undefined : amount,
          received: add ? amount : undefined,
          balanceAfter: newBal,
          notes: remarks,
        };
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, balance: newBal } : a)),
          transactions: [t, ...s.transactions],
        }));
      },
      transfer: ({ fromId, toId, amount, dateIso, remarks }) => {
        if (amount <= 0 || fromId === toId) return false;
        const state = get();
        const from = state.accounts.find((a) => a.id === fromId);
        const to = state.accounts.find((a) => a.id === toId);
        if (!from || !to) return false;
        if (from.balance < amount) return false;
        const idBase = Date.now();
        const newFrom = Math.round((from.balance - amount) * 100) / 100;
        const newTo = Math.round((to.balance + amount) * 100) / 100;
        const tOut: CashBankTransaction = {
          id: `txn-${idBase}-out`,
          accountId: fromId,
          date: dateIso,
          rowType: "TRANSFER_OUT",
          party: `To ${to.displayName}`,
          mode: "Transfer",
          paid: amount,
          balanceAfter: newFrom,
          notes: remarks,
        };
        const tIn: CashBankTransaction = {
          id: `txn-${idBase}-in`,
          accountId: toId,
          date: dateIso,
          rowType: "TRANSFER_IN",
          party: `From ${from.displayName}`,
          mode: "Transfer",
          received: amount,
          balanceAfter: newTo,
          notes: remarks,
        };
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id === fromId) return { ...a, balance: newFrom };
            if (a.id === toId) return { ...a, balance: newTo };
            return a;
          }),
          transactions: [tOut, tIn, ...s.transactions],
        }));
        return true;
      },
    }),
    { name: "prime-detailers-cash-bank" }
  )
);

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "prime-detailers-cash-bank" && e.newValue != null) {
      void useCashBankStore.persist.rehydrate();
    }
  });
}

export function totalCashBankBalance(accounts: CashBankAccount[]): number {
  return Math.round(accounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
}
