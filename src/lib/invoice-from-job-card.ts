import type { Invoice, InvoiceLineItem, JobCard } from "@/types";
import { useJobCardStore } from "@/store/job-card-store";
import { useInvoiceStore } from "@/store/invoice-store";

const TAX_RATE = 0.18;

const DEFAULT_TERMS =
  "Payment is due within 7 days of invoice date. Late payments may incur interest charges. All work is guaranteed for 30 days on parts replaced.";

/** Build a billable invoice from a delivered job card (services → line items, GST). */
export function buildInvoiceFromJobCard(
  job: JobCard,
  invoiceNumber: string,
  invoiceId: string
): Invoice {
  const lineItems: InvoiceLineItem[] = job.services.map((s, i) => ({
    id: `li-${invoiceId}-${i}`,
    description: s.name,
    type: "SERVICE" as const,
    quantity: 1,
    unitPrice: s.price,
    total: s.price,
  }));

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    id: invoiceId,
    invoiceNumber,
    jobCardId: job.id,
    jobNumber: job.jobNumber,
    customerId: job.customerId,
    customerName: job.customerName,
    customerPhone: job.customerPhone,
    vehicleRegNumber: job.vehicleRegNumber,
    lineItems,
    subtotal,
    taxRate: TAX_RATE,
    taxAmount,
    discountAmount: 0,
    rewardDiscount: 0,
    walletAmountUsed: 0,
    grandTotal,
    status: "ISSUED",
    payments: [],
    termsAndConditions: job.termsAndConditions ?? DEFAULT_TERMS,
    mechanicName: job.mechanicName,
    notes: job.notes,
    createdAt: new Date().toISOString(),
  };
}

export type CreateInvoiceForJobResult =
  | { ok: true; invoiceId: string; invoiceNumber: string; created: boolean }
  | { ok: false; code: "NOT_FOUND" | "NOT_DELIVERED" | "NO_SERVICES" };

/**
 * Returns an existing invoice for the job or creates one from a delivered job card.
 * Used by Billing (?jobCardId=) and job card “Generate Invoice”.
 */
export function createOrGetInvoiceForJob(jobCardId: string): CreateInvoiceForJobResult {
  const jc = useJobCardStore.getState().jobCards.find((j) => j.id === jobCardId);
  if (!jc) return { ok: false, code: "NOT_FOUND" };

  const existing = useInvoiceStore.getState().invoices.find((inv) => inv.jobCardId === jobCardId);
  if (existing) {
    return {
      ok: true,
      invoiceId: existing.id,
      invoiceNumber: existing.invoiceNumber,
      created: false,
    };
  }

  if (jc.status !== "DELIVERED") return { ok: false, code: "NOT_DELIVERED" };
  if (!jc.services.length) return { ok: false, code: "NO_SERVICES" };

  const invoiceId = `inv-${Date.now().toString(36)}`;
  const number = useInvoiceStore.getState().getNextInvoiceNumber();
  const inv = buildInvoiceFromJobCard(jc, number, invoiceId);
  useInvoiceStore.getState().addInvoice(inv);

  return {
    ok: true,
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    created: true,
  };
}
