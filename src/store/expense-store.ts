"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { expenses as seedExpenses } from "@/lib/mock-data";
import type { Expense, ExpenseCategory } from "@/types";

export type AddExpenseInput = {
  category: ExpenseCategory;
  description: string;
  amount: number;
  /** ISO date string YYYY-MM-DD */
  date: string;
  createdBy: string;
  createdByName: string;
  branchId: string;
};

interface ExpenseStore {
  expenses: Expense[];
  addExpense: (input: AddExpenseInput) => Expense;
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set) => ({
      expenses: seedExpenses,

      addExpense: (input) => {
        const now = new Date().toISOString();
        const expense: Expense = {
          id: `exp-${Date.now()}`,
          category: input.category,
          description: input.description.trim(),
          amount: input.amount,
          date: input.date,
          createdBy: input.createdBy,
          createdByName: input.createdByName,
          branchId: input.branchId,
          createdAt: now,
        };
        set((state) => ({
          expenses: [expense, ...state.expenses],
        }));
        return expense;
      },
    }),
    { name: "prime-detailers-expenses" }
  )
);
