import type {
  Appointment,
  Customer,
  Expense,
  Invoice,
  JobCard,
  Part,
  Quotation,
  ServiceCatalogItem,
  User,
  Vehicle,
} from "@/types";

/** Minimum characters before search runs (avoid noisy single-letter matches). */
export const GLOBAL_SEARCH_MIN_CHARS = 2;

/** Max matches per category in the header dropdown. */
const LIMIT = 5;

export type GlobalSearchSectionKey =
  | "customers"
  | "vehicles"
  | "jobCards"
  | "quotations"
  | "invoices"
  | "appointments"
  | "staff"
  | "parts"
  | "services"
  | "expenses";

export type GlobalSearchHit = {
  id: string;
  href: string;
  title: string;
  meta?: string;
};

export type GlobalSearchSection = {
  key: GlobalSearchSectionKey;
  label: string;
  hits: GlobalSearchHit[];
};

function matches(hay: string | undefined | null, q: string): boolean {
  if (hay == null || hay === "") return false;
  return hay.toLowerCase().includes(q);
}

function phoneMatches(phone: string | undefined | null, q: string): boolean {
  if (!phone) return false;
  const qd = q.replace(/\D/g, "");
  if (qd.length < 2) return false;
  return phone.replace(/\D/g, "").includes(qd);
}

export type GlobalSearchInput = {
  customers: Customer[];
  vehicles: Vehicle[];
  jobCards: JobCard[];
  quotations: Quotation[];
  invoices: Invoice[];
  staff: User[];
  appointments: Appointment[];
  parts: Part[];
  serviceCatalog: ServiceCatalogItem[];
  expenses: Expense[];
};

export function runGlobalSearch(
  rawQuery: string,
  data: GlobalSearchInput
): GlobalSearchSection[] {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < GLOBAL_SEARCH_MIN_CHARS) return [];

  const sections: GlobalSearchSection[] = [];

  const custHits: GlobalSearchHit[] = [];
  for (const c of data.customers) {
    if (custHits.length >= LIMIT) break;
    if (
      matches(c.name, q) ||
      matches(c.email, q) ||
      matches(c.address, q) ||
      matches(c.referralCode, q) ||
      phoneMatches(c.phone, q)
    ) {
      custHits.push({
        id: c.id,
        href: `/customers/${c.id}`,
        title: c.name,
        meta: [c.phone, c.email].filter(Boolean).join(" · "),
      });
    }
  }
  if (custHits.length) sections.push({ key: "customers", label: "Customers", hits: custHits });

  const vehHits: GlobalSearchHit[] = [];
  for (const v of data.vehicles) {
    if (vehHits.length >= LIMIT) break;
    const blob = [
      v.registrationNumber,
      v.make,
      v.model,
      v.variant,
      v.customerName,
      v.notes,
      v.color,
      String(v.year),
    ]
      .filter(Boolean)
      .join(" ");
    if (matches(blob, q) || matches(v.registrationNumber.replace(/\s/g, ""), q.replace(/\s/g, ""))) {
      vehHits.push({
        id: v.id,
        href: `/vehicles/${v.id}`,
        title: `${v.registrationNumber} — ${v.make} ${v.model}`,
        meta: v.customerName,
      });
    }
  }
  if (vehHits.length) sections.push({ key: "vehicles", label: "Vehicles", hits: vehHits });

  const jobHits: GlobalSearchHit[] = [];
  for (const j of data.jobCards) {
    if (jobHits.length >= LIMIT) break;
    if (
      matches(j.jobNumber, q) ||
      matches(j.customerName, q) ||
      matches(j.vehicleRegNumber, q) ||
      matches(j.vehicleMakeModel, q) ||
      matches(j.reportedIssues, q) ||
      matches(j.status, q) ||
      phoneMatches(j.customerPhone, q) ||
      (j.services?.some((s) => matches(s.name, q) || matches(s.serviceCatalogId, q)) ?? false)
    ) {
      jobHits.push({
        id: j.id,
        href: `/job-cards/${j.id}`,
        title: j.jobNumber,
        meta: `${j.customerName} · ${j.vehicleRegNumber}`,
      });
    }
  }
  if (jobHits.length) sections.push({ key: "jobCards", label: "Job cards", hits: jobHits });

  const quoHits: GlobalSearchHit[] = [];
  for (const quo of data.quotations) {
    if (quoHits.length >= LIMIT) break;
    if (
      matches(quo.quotationNumber, q) ||
      matches(quo.customerName, q) ||
      matches(quo.vehicleRegNumber, q) ||
      matches(quo.vehicleMakeModel, q) ||
      matches(quo.status, q) ||
      phoneMatches(quo.customerPhone, q) ||
      quo.services.some((s) => matches(s.name, q))
    ) {
      quoHits.push({
        id: quo.id,
        href: "/quotations",
        title: quo.quotationNumber,
        meta: `${quo.customerName} · ${quo.vehicleRegNumber}`,
      });
    }
  }
  if (quoHits.length) sections.push({ key: "quotations", label: "Quotations", hits: quoHits });

  const invHits: GlobalSearchHit[] = [];
  for (const inv of data.invoices) {
    if (invHits.length >= LIMIT) break;
    const lineText = inv.lineItems.map((l) => `${l.description} ${l.type}`).join(" ");
    if (
      matches(inv.invoiceNumber, q) ||
      matches(inv.jobNumber, q) ||
      matches(inv.customerName, q) ||
      matches(inv.customerPhone, q) ||
      matches(inv.vehicleRegNumber, q) ||
      matches(inv.mechanicName, q) ||
      matches(inv.status, q) ||
      matches(lineText, q) ||
      phoneMatches(inv.customerPhone, q)
    ) {
      invHits.push({
        id: inv.id,
        href: `/billing/${inv.id}`,
        title: inv.invoiceNumber,
        meta: `${inv.customerName} · ${inv.vehicleRegNumber}`,
      });
    }
  }
  if (invHits.length) sections.push({ key: "invoices", label: "Invoices", hits: invHits });

  const apptHits: GlobalSearchHit[] = [];
  for (const a of data.appointments) {
    if (apptHits.length >= LIMIT) break;
    if (
      matches(a.bookingId, q) ||
      matches(a.customerName, q) ||
      matches(a.vehicleRegNumber, q) ||
      matches(a.vehicleMakeModel, q) ||
      matches(a.serviceType, q) ||
      matches(a.status, q) ||
      matches(a.notes, q) ||
      matches(a.date, q) ||
      phoneMatches(a.customerPhone, q)
    ) {
      apptHits.push({
        id: a.id,
        href: "/appointments",
        title: `${a.bookingId} — ${a.serviceType}`,
        meta: `${a.customerName} · ${a.vehicleRegNumber} · ${a.date}`,
      });
    }
  }
  if (apptHits.length) sections.push({ key: "appointments", label: "Appointments", hits: apptHits });

  const staffHits: GlobalSearchHit[] = [];
  for (const s of data.staff) {
    if (staffHits.length >= LIMIT) break;
    if (
      matches(s.name, q) ||
      matches(s.email, q) ||
      matches(s.phone, q) ||
      matches(s.role, q)
    ) {
      staffHits.push({
        id: s.id,
        href: `/staff/${s.id}`,
        title: s.name,
        meta: `${s.role.replace(/_/g, " ")} · ${s.email}`,
      });
    }
  }
  if (staffHits.length) sections.push({ key: "staff", label: "Staff", hits: staffHits });

  const partHits: GlobalSearchHit[] = [];
  for (const p of data.parts) {
    if (partHits.length >= LIMIT) break;
    if (
      matches(p.name, q) ||
      matches(p.sku, q) ||
      matches(p.category, q) ||
      matches(p.supplier, q) ||
      matches(p.vendor, q)
    ) {
      partHits.push({
        id: p.id,
        href: "/inventory",
        title: p.name,
        meta: [p.sku, p.category].filter(Boolean).join(" · "),
      });
    }
  }
  if (partHits.length) sections.push({ key: "parts", label: "Inventory", hits: partHits });

  const svcHits: GlobalSearchHit[] = [];
  for (const s of data.serviceCatalog) {
    if (!s.isActive) continue;
    if (svcHits.length >= LIMIT) break;
    if (matches(s.name, q) || matches(s.description, q) || matches(s.category, q)) {
      svcHits.push({
        id: s.id,
        href: "/services",
        title: s.name,
        meta: s.category,
      });
    }
  }
  if (svcHits.length) sections.push({ key: "services", label: "Services", hits: svcHits });

  const expHits: GlobalSearchHit[] = [];
  for (const e of data.expenses) {
    if (expHits.length >= LIMIT) break;
    const qNum = q.replace(/[^\d.]/g, "");
    const amountMatch = qNum.length >= 1 && String(e.amount).includes(qNum);
    if (
      matches(e.description, q) ||
      matches(e.category, q) ||
      matches(e.createdByName, q) ||
      amountMatch
    ) {
      expHits.push({
        id: e.id,
        href: "/expenses",
        title: e.description.slice(0, 60) + (e.description.length > 60 ? "…" : ""),
        meta: `${e.category} · ₹${e.amount}`,
      });
    }
  }
  if (expHits.length) sections.push({ key: "expenses", label: "Expenses", hits: expHits });

  return sections;
}
