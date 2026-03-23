"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoices as mockInvoices } from "@/lib/mock-data";
import type { Invoice, InvoiceStatus, Payment } from "@/types";
import { useInventoryStore } from "@/store/inventory-store";
import { useJobCardStore } from "@/store/job-card-store";

interface InvoiceStore {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  getNextInvoiceNumber: () => string;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  /** Append payment, recompute status, apply inventory when fully paid. */
  recordPayment: (
    invoiceId: string,
    payment: Omit<Payment, "id"> & { id?: string },
    options: { performedBy: string }
  ) => { ok: boolean; inventoryError?: string };
}

function computeInvoiceStatus(
  inv: Invoice,
  payments: Payment[]
): InvoiceStatus {
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  if (paid >= inv.grandTotal - 0.01) return "PAID";
  if (paid > 0) return "PARTIALLY_PAID";
  return inv.status;
}

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      invoices: mockInvoices,

      addInvoice: (invoice) =>
        set((state) => ({ invoices: [invoice, ...state.invoices] })),

      getNextInvoiceNumber: () => {
        const all = get().invoices;
        const maxNum = all.reduce((max, inv) => {
          const match = inv.invoiceNumber.match(/INV-\d{4}-(\d+)/);
          return match ? Math.max(max, parseInt(match[1], 10)) : max;
        }, 0);
        return `INV-2026-${String(maxNum + 1).padStart(4, "0")}`;
      },

      updateInvoice: (id, updates) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        })),

      recordPayment: (invoiceId, payment, options) => {
        const inv = get().invoices.find((i) => i.id === invoiceId);
        if (!inv) return { ok: false, inventoryError: "Invoice not found" };

        const newPayment: Payment = {
          ...payment,
          id: payment.id ?? `pay-${Date.now()}`,
          invoiceId,
        };
        const payments = [...inv.payments, newPayment];
        const status = computeInvoiceStatus(inv, payments);

        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === invoiceId ? { ...i, payments, status } : i
          ),
        }));

        let inventoryError: string | undefined;
        if (status === "PAID" && !inv.inventoryDeductedAt) {
          const jobCard = useJobCardStore
            .getState()
            .jobCards.find((j) => j.id === inv.jobCardId);
          const result = useInventoryStore
            .getState()
            .applyDeductionForInvoice(
              { ...inv, payments, status },
              jobCard,
              options.performedBy
            );
          if (result.ok) {
            get().updateInvoice(invoiceId, {
              inventoryDeductedAt: new Date().toISOString(),
            });
          } else {
            inventoryError = result.error;
          }
        }

        return { ok: true, inventoryError };
      },
    }),
    { name: "prime-detailers-invoices" }
  )
);
