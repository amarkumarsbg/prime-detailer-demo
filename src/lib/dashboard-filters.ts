import type { Customer, Invoice, JobCard, Part, ServiceReminder } from "@/types";

export function isOverdueJobCard(jc: JobCard): boolean {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const expected = new Date(jc.expectedDelivery);
  return expected < todayStart && !["DELIVERED", "CANCELLED"].includes(jc.status);
}

/** Low stock: ml-tracked uses stock/reorder ml; else quantity vs reorder level. */
export function isLowStockPart(p: Part): boolean {
  if (p.stockQuantityMl != null && p.reorderLevelMl != null) {
    return p.stockQuantityMl <= p.reorderLevelMl;
  }
  return p.quantity <= p.reorderLevel;
}

export function isPendingPaymentInvoice(inv: Invoice): boolean {
  return inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID";
}

/** Due on or before end of today + 7 days; excludes completed/dismissed. */
export function isDueSoonReminder(r: ServiceReminder): boolean {
  if (r.status === "COMPLETED" || r.status === "DISMISSED") return false;
  const end = new Date();
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return new Date(r.dueDate).getTime() <= end.getTime();
}

export function isInactiveCustomer(c: Customer): boolean {
  if (!c.lastVisitDate) return true;
  const last = new Date(c.lastVisitDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  cutoff.setHours(0, 0, 0, 0);
  return last < cutoff;
}
