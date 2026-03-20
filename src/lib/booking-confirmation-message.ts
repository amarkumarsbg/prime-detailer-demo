import { format, parseISO } from "date-fns";
import type { Appointment } from "@/types";

const OUR_SERVICES_LINE =
  "Foam Wash | Steam Wash | Underbody Cleaning | Interior Deep Dry Clean | Odour Removal | Rubbing Polish | Clay Bar Treatment | Headlight Restoration | Nitrogen Fill | Teflon Coating | 9H Ceramic | 3M Ceramic | Meguiar's Ceramic | 10H Ceramic | Graphene | PPF (TPU)";

const PRODUCTS_LINE =
  "We use 100% original products from 3M, Meguiar's, Puris, SystemX, PaintGuard, Garware, XPEL, Llumar, Saint-Gobain & more.";

const DISCLAIMER = `No detailing service is perfect. Most complaints arise from pre-existing conditions that become visible after cleaning. Our team is not liable for mechanical or electrical issues revealed post-service. Sensitive areas (engine bay, infotainment, cameras) are avoided. Your presence during the service is required. Please remove all valuables before handover.`;

const TERMS = `(a) GST invoice provided online. (b) Services subject to availability and feasibility. (c) Advance is non-refundable or non-transferable upon customer cancellation or rescheduling. (d) Visit/pickup charges: Rs. 200 minimum + Rs. 10/km beyond 10 km from our studio.`;

function formatRs(amount: number): string {
  return `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
}

function firstName(apt: Appointment): string {
  if (apt.customerFirstName?.trim()) return apt.customerFirstName.trim();
  return apt.customerName.split(/\s+/)[0] ?? apt.customerName;
}

function bookingDateTimeLine(apt: Appointment): string {
  const d = parseISO(apt.date);
  const day = format(d, "EEE, dd-MMM-yyyy");
  return `*${day}* (${apt.time})`;
}

function expectedDeliveryLine(apt: Appointment): string {
  if (apt.expectedDeliveryDate) {
    const ed = parseISO(apt.expectedDeliveryDate);
    return format(ed, "EEE, dd-MMM-yyyy");
  }
  return "— (to be confirmed)";
}

export type BookingConfirmationBusiness = {
  studioName: string;
  address: string;
  phone: string;
  email: string;
};

export function buildBookingConfirmationMessage(
  apt: Appointment,
  business: BookingConfirmationBusiness
): string {
  const name = firstName(apt);
  const vehicleLine = apt.vehicleColor
    ? `${apt.vehicleMakeModel} (${apt.vehicleColor})`
    : apt.vehicleMakeModel;

  const bookingDetailsExtra =
    apt.bookingPricingLine?.trim() ||
    `Pricing and package details will be confirmed at the studio.`;

  const priceBlock =
    apt.priceSubtotalExGst != null &&
    apt.priceGstAmount != null &&
    apt.priceGrandTotal != null
      ? [
          `*PRICE DETAILS:*`,
          `${formatRs(apt.priceSubtotalExGst)} + ${formatRs(apt.priceGstAmount)} (GST) = *${formatRs(apt.priceGrandTotal)}*`,
          apt.advancePaid != null ? `Advance Paid: ${formatRs(apt.advancePaid)}` : "",
          apt.advancePolicyNote
            ? `Note: ${apt.advancePolicyNote}`
            : "Note: 30% advance required to confirm and pre-schedule your slot.",
        ]
          .filter(Boolean)
          .join("\n")
      : [
          `*PRICE DETAILS:*`,
          `Pricing will be confirmed at the studio before work begins.`,
          apt.advancePaid != null ? `Advance Paid: ${formatRs(apt.advancePaid)}` : "",
          apt.advancePolicyNote
            ? `Note: ${apt.advancePolicyNote}`
            : "Note: 30% advance required to confirm and pre-schedule your slot.",
        ]
          .filter(Boolean)
          .join("\n");

  const deliveryNote =
    apt.deliveryExpectationNote?.trim() ||
    "(We will do our best to deliver by Saturday evening.)";

  const wa = (apt.whatsappPhone ?? apt.customerPhone).trim();
  const mobile = apt.customerPhone.trim();

  return [
    `Hi *${name}*,`,
    `Your booking *(No: ${apt.bookingId})* has been confirmed at *${business.studioName}.*`,
    ``,
    `*BOOKING DETAILS:*`,
    vehicleLine,
    apt.serviceType,
    bookingDetailsExtra,
    ``,
    priceBlock,
    ``,
    `*BOOKING DATE & TIME:*`,
    bookingDateTimeLine(apt),
    `Expected Delivery: ${expectedDeliveryLine(apt)}`,
    deliveryNote,
    `Please arrive 30 minutes before your slot so we can begin on time.`,
    ``,
    `*CUSTOMER DETAILS:*`,
    `Name: ${apt.customerName}`,
    `Mobile: ${mobile} | WhatsApp: ${wa}`,
    `Address: ${apt.customerAddress ?? "—"}`,
    ``,
    `*OUR SERVICES:*`,
    OUR_SERVICES_LINE,
    ``,
    PRODUCTS_LINE,
    ``,
    `*DISCLAIMER:*`,
    DISCLAIMER,
    ``,
    `*TERMS & CONDITIONS:*`,
    TERMS,
    ``,
    `Regards,`,
    `*Team Prime Detailers*`,
    `${business.address}`,
    `${business.phone} | ${business.email}`,
  ].join("\n");
}

/** Digits only for wa.me (e.g. 919369111655) */
export function whatsappDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.startsWith("91") && d.length >= 12) return d;
  return d;
}

export function buildWhatsAppBookingUrl(apt: Appointment, message: string): string {
  const target = whatsappDigits(apt.whatsappPhone ?? apt.customerPhone);
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

/**
 * Picks a saved appointment for the “Demo: WhatsApp” preview.
 * Prefers apt-019 (5022) if present, then the richest pricing row, then earliest active booking.
 */
export function pickAppointmentForWhatsAppPreview(appointments: Appointment[]): Appointment | null {
  if (appointments.length === 0) return null;
  const preferred = appointments.find((a) => a.id === "apt-019");
  if (preferred) return preferred;
  const withPricing = appointments.find(
    (a) =>
      a.priceGrandTotal != null &&
      a.status !== "CANCELLED" &&
      a.status !== "COMPLETED"
  );
  if (withPricing) return withPricing;
  const active = appointments.filter(
    (a) => a.status !== "CANCELLED" && a.status !== "COMPLETED"
  );
  if (active.length > 0) {
    return [...active].sort((a, b) => {
      const ta = new Date(`${a.date}T${a.time}`).getTime();
      const tb = new Date(`${b.date}T${b.time}`).getTime();
      return ta - tb;
    })[0]!;
  }
  return appointments[0]!;
}
