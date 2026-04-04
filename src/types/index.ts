/** Org-level super user: full access including branch CRUD. */
export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "BRANCH_MANAGER"
  | "MANAGER"
  | "SUPERVISOR"
  | "RECEPTIONIST"
  | "MECHANIC";

export type VehicleSegment =
  | "HATCHBACK"
  | "SEDAN"
  | "SUV"
  | "LUXURY"
  | "MUV"
  | "COMPACT_SUV"
  | "BIKE";

export type JobCardStatus =
  | "RECEIVED"
  | "INSPECTION"
  | "AWAITING_SERVICE"
  | "QUALITY_CHECK"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID";

export type QuotationStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "CONVERTED";

export type PaymentMethod = "CASH" | "UPI" | "CARD" | "WALLET";

export type FuelType = "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID";

export type InspectionPhotoType = "BEFORE" | "AFTER";

export type ExpenseCategory = "RENT" | "SALARY" | "UTILITIES" | "SUPPLIES" | "MAINTENANCE" | "MARKETING" | "INSURANCE" | "MISCELLANEOUS";

export type WhatsAppEventType =
  | "BOOKING_CONFIRMED"
  | "ESTIMATE_SENT"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "PAYMENT_RECEIVED"
  | "REMINDER_DUE";

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  qrCodeId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string;
  avatar?: string;
  isActive: boolean;
  /** Demo flag for directory / “verified email” stats */
  emailVerified?: boolean;
  /** Demo-only attendance PIN; production should store hashes and verify via API */
  attendancePin?: string;
  totalJobsCompleted?: number;
  totalIncentiveEarned?: number;
  /** ISO date yyyy-mm-dd (demo / HR fields) */
  birthday?: string;
  /** Employment start or work anniversary, ISO yyyy-mm-dd */
  anniversary?: string;
}

export type PayrollRecordStatus = "PENDING" | "PROCESSING" | "PAID";

/** Experience band for salary structure tiers (role + band = pay rules). */
export type ExperienceBand = "ENTRY" | "MID" | "SENIOR" | "LEAD";

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  periodMonth: number;
  periodYear: number;
  attendanceDays: number;
  presencePayment: number;
  baseSalary: number;
  absenceDeduction: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollRecordStatus;
  salaryStructureId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructure {
  id: string;
  role: UserRole;
  experienceBand: ExperienceBand;
  label: string;
  baseSalary: number;
  attendanceBonusPerDay: number;
  absenceDeductionPerDay: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  referralCode: string;
  referredBy?: string;
  totalVisits: number;
  rewardPoints: number;
  walletBalance: number;
  lastVisitDate?: string;
  isInactive?: boolean;
  /** Demo: counts toward “verified email” on users overview */
  emailVerified?: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  customerName: string;
  registrationNumber: string;
  make: string;
  model: string;
  segment: VehicleSegment;
  variant?: string;
  fuelType: FuelType;
  color: string;
  year: number;
  notes?: string;
  /** Outgoing owners in chronological order (matches ownership_transfers from_customer chain). */
  previousOwners?: {
    customerId: string;
    customerName: string;
    transferDate: string;
    reason?: string;
  }[];
}

export interface SegmentPricing {
  HATCHBACK: number;
  SEDAN: number;
  SUV: number;
  LUXURY: number;
  MUV: number;
  COMPACT_SUV: number;
  BIKE: number;
}

export interface ServiceConsumption {
  partId: string;
  partName: string;
  quantityPerCar: number;
  unit: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  segmentPricing: SegmentPricing;
  category: string;
  /** When true, listed in booking “Select Add-ons” and omitted from the main service grid */
  isAddon?: boolean;
  isActive: boolean;
  isHighEnd: boolean;
  incentivePercent: number;
  reminderInterval?: string;
  reminderDurationMonths?: number;
  consumptionProfile?: ServiceConsumption[];
  /** Estimated service duration (minutes) */
  durationMinutes?: number;
  /** Upper bound for duration range (e.g. 40–50 min) */
  maxDurationMinutes?: number;
  gstApplicable?: boolean;
  gstPercent?: number;
}

export interface ServiceItem {
  id: string;
  jobCardId: string;
  serviceCatalogId: string;
  name: string;
  price: number;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface InspectionPhoto {
  id: string;
  type: InspectionPhotoType;
  url: string;
  caption?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface MechanicSwitchLog {
  fromMechanicId: string;
  fromMechanicName: string;
  toMechanicId: string;
  toMechanicName: string;
  reason: string;
  switchedAt: string;
  switchedBy: string;
}

export interface JobCard {
  id: string;
  jobNumber: string;
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleRegNumber: string;
  vehicleMakeModel: string;
  vehicleSegment: VehicleSegment;
  mechanicId?: string;
  mechanicName?: string;
  status: JobCardStatus;
  reportedIssues: string;
  odometerReading?: number;
  expectedDelivery: string;
  actualDelivery?: string;
  services: ServiceItem[];
  estimatedAmount: number;
  incentivePercent: number;
  incentiveAmount: number;
  termsAndConditions?: string;
  notes?: string;
  inspectionPhotos?: InspectionPhoto[];
  /** Set when QC checklist is marked complete on the job card (unlocks After photos). */
  qualityCheckCompleted?: boolean;
  mechanicSwitchLog?: MechanicSwitchLog[];
  quotationId?: string;
  highEndServiceIds?: string[];
  /** For each high-end service id, months until the first maintenance reminder (preset from reminderIntervals or a custom value). */
  highEndFirstFollowUpMonthsByServiceId?: Record<string, number>;
  whatsappLog?: WhatsAppLog[];
  /** Set when materials were deducted from stock at Ready (billing no longer deducts). */
  inventoryConsumedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleRegNumber: string;
  vehicleMakeModel: string;
  vehicleSegment: VehicleSegment;
  services: { serviceCatalogId: string; name: string; price: number }[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: QuotationStatus;
  sentViaWhatsApp: boolean;
  customerApproved?: boolean;
  convertedToJobCardId?: string;
  convertedToInvoiceId?: string;
  termsAndConditions?: string;
  notes?: string;
  validUntil: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  type: "SERVICE" | "PARTS" | "LABOR" | "OTHER";
  quantity: number;
  unitPrice: number;
  total: number;
  /** SAC/HSN for GST line (e.g. 998714). Defaults in UI when omitted. */
  hsnSac?: string;
  /** Line-level discount in ₹ (before tax). */
  lineDiscount?: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  paidAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobCardId: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleRegNumber: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  rewardDiscount: number;
  walletAmountUsed: number;
  grandTotal: number;
  status: InvoiceStatus;
  payments: Payment[];
  termsAndConditions?: string;
  mechanicName?: string;
  notes?: string;
  createdAt: string;
  /** When set, inventory was already deducted for this invoice (idempotency). */
  inventoryDeductedAt?: string;
}

export interface DashboardStats {
  /** Demo aggregate customer satisfaction (0–5). */
  averageRating: number;
  carsReceivedToday: number;
  carsDeliveredToday: number;
  inProgressServices: number;
  dailyRevenue: number;
  totalExpensesToday: number;
  netProfitToday: number;
  newCustomersToday: number;
  inactiveCustomers: number;
  activeJobCards: number;
  pendingPayments: number;
  monthlyRevenue: { month: string; revenue: number; expenses: number; profit: number }[];
  serviceBreakdown: { name: string; count: number }[];
  todaysBookings: JobCard[];
  readyForDelivery: JobCard[];
}

export type PartCategory =
  | "Engine"
  | "Brakes"
  | "Electrical"
  | "Filters"
  | "Suspension"
  | "AC"
  | "Body"
  | "Lubricants"
  | "Tires"
  | "Detailing"
  | "Other";

export interface Part {
  id: string;
  name: string;
  sku: string;
  category: PartCategory;
  /** Count-based stock (pieces, sets, kg, etc.). Not used when stockQuantityMl is set. */
  quantity: number;
  primaryUnit: string;
  secondaryUnit: string;
  conversionFactor: number;
  unitPrice: number;
  /** Reorder threshold for count-based parts. */
  reorderLevel: number;
  supplier: string;
  vendor?: string;
  purchaseDate?: string;
  lastRestocked: string;
  /**
   * Fluid stock in millilitres (canonical). When set, internal calculations use ml;
   * primary display unit is litres (1 L = 1000 ml).
   */
  stockQuantityMl?: number;
  /** Reorder threshold in ml for fluid parts. */
  reorderLevelMl?: number;
}

export interface StockMovement {
  id: string;
  partId: string;
  type: "IN" | "OUT";
  quantity: number;
  unit: string;
  reason: string;
  jobCardId?: string;
  invoiceId?: string;
  purchaseId?: string;
  vendor?: string;
  performedBy: string;
  createdAt: string;
}

export interface ProductPurchase {
  id: string;
  partId: string;
  vendorName: string;
  quantityMl: number;
  unitCost?: number;
  reference?: string;
  purchasedAt: string;
  recordedBy: string;
}

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface Appointment {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleRegNumber: string;
  vehicleMakeModel: string;
  serviceType: string;
  mechanicId?: string;
  mechanicName?: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  whatsappSent: boolean;
  createdAt: string;
  /** First name for "Hi *Name*" in confirmation WhatsApp */
  customerFirstName?: string;
  vehicleColor?: string;
  /** Alternate WhatsApp; defaults to customerPhone */
  whatsappPhone?: string;
  customerAddress?: string;
  /** e.g. list − discount = net (−additional disc) *One Time Only* */
  bookingPricingLine?: string;
  /** GST-exclusive subtotal for PRICE DETAILS */
  priceSubtotalExGst?: number;
  priceGstAmount?: number;
  priceGrandTotal?: number;
  advancePaid?: number;
  /** Shown under advance (e.g. 30% advance policy) */
  advancePolicyNote?: string;
  /** yyyy-MM-dd */
  expectedDeliveryDate?: string;
  /** e.g. Saturday evening delivery note */
  deliveryExpectationNote?: string;
}

export type ActivityEntityType =
  | "JOB_CARD"
  | "CUSTOMER"
  | "VEHICLE"
  | "INVOICE"
  | "APPOINTMENT"
  | "INVENTORY"
  | "STAFF"
  | "QUOTATION"
  | "EXPENSE"
  | "WALLET";

export type ActivityAction =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "PAYMENT_RECEIVED"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED"
  | "STOCK_ADJUSTED"
  | "WHATSAPP_SENT"
  | "MECHANIC_SWITCHED"
  | "OWNERSHIP_TRANSFERRED"
  | "WALLET_CREDITED"
  | "WALLET_DEBITED";

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityLabel: string;
  userId: string;
  userName: string;
  details: string;
  createdAt: string;
}

export type ReminderStatus = "UPCOMING" | "DUE" | "OVERDUE" | "COMPLETED" | "DISMISSED";
export type ReminderType = "GENERAL_SERVICE" | "OIL_CHANGE" | "BRAKE_INSPECTION" | "TIRE_ROTATION" | "AC_SERVICE" | "BATTERY_CHECK" | "INSURANCE" | "PUC" | "PPF_MAINTENANCE" | "CERAMIC_MAINTENANCE";
export type ReminderFrequency = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "YEARLY" | "CUSTOM";

export interface ServiceReminder {
  id: string;
  vehicleId: string;
  vehicleRegNumber: string;
  vehicleMakeModel: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: ReminderType;
  frequency: ReminderFrequency;
  dueDate: string;
  lastServiceDate?: string;
  lastJobCardId?: string;
  odometerAtLastService?: number;
  nextDueOdometer?: number;
  status: ReminderStatus;
  isHighEndService: boolean;
  totalDurationMonths?: number;
  intervalMonths?: number;
  notes?: string;
  /** @deprecated use lastMessageSentAt; kept for persisted mock data */
  whatsappSent?: boolean;
  /** ISO timestamp when a customer reminder message was last sent (e.g. WhatsApp). */
  lastMessageSentAt?: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt?: string;
  createdBy: string;
  createdByName: string;
  branchId: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: UserRole;
  branchId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  durationMinutes?: number;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
  qrScanned: boolean;
}

export interface WalletTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  source: "REFERRAL_REWARD" | "LOYALTY_POINTS" | "ADMIN_CREDIT" | "INVOICE_PAYMENT" | "REFUND";
  referenceId?: string;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastVisitDate: string;
  daysSinceLastVisit: number;
  assignedTo?: string;
  assignedToName?: string;
  status: "PENDING" | "CALLED" | "SCHEDULED" | "NOT_INTERESTED" | "REENGAGED";
  callNotes?: string;
  nextCallbackDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppLog {
  id: string;
  eventType: WhatsAppEventType;
  customerPhone: string;
  customerName: string;
  message: string;
  sentAt: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  relatedEntityId?: string;
  relatedEntityType?: string;
}
