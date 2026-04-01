"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Ticket, CheckCircle2, XCircle, Camera, Upload, X } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { serviceCatalog } from "@/lib/mock-data";
import { useVehicleStore } from "@/store/vehicle-store";
import { useJobCardStore } from "@/store/job-card-store";
import type { InspectionPhoto } from "@/types";
import { useStaffStore } from "@/store/staff-store";
import { useHighEndServiceStore } from "@/store/high-end-service-store";
import { useCustomerStore } from "@/store/customer-store";
import { useWalletStore } from "@/store/wallet-store";
import { useSettingsStore } from "@/store/settings-store";
import { useVehicleCatalogStore } from "@/store/vehicle-catalog-store";
import { formatCurrency } from "@/lib/utils";
import { pushActivityLog } from "@/lib/activity-log-helper";
import {
  INDIAN_VEHICLE_REG_HINT,
  isValidIndianVehicleRegistration,
  normalizeRegistrationNumber,
  sanitizeVehicleRegistrationInput,
} from "@/lib/vehicle-registration";
import type { Vehicle, VehicleSegment, ServiceCatalogItem } from "@/types";

function formatHighEndIntervalMonths(m: number): string {
  return m >= 12 ? `${m / 12}yr` : `${m}mo`;
}

const SEGMENT_OPTIONS: { value: VehicleSegment; label: string }[] = [
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "COMPACT_SUV", label: "Compact SUV" },
  { value: "MUV", label: "MUV" },
  { value: "LUXURY", label: "Luxury" },
];

/** datetime-local value is interpreted in the user's local timezone. */
function resolveExpectedDeliveryIso(datetimeLocal: string, daysFromNowStr: string): string {
  const trimmedDt = datetimeLocal.trim();
  if (trimmedDt) {
    const d = new Date(trimmedDt);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const parsed = Number.parseInt(daysFromNowStr.trim(), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    const end = new Date();
    end.setDate(end.getDate() + parsed);
    end.setHours(18, 0, 0, 0);
    return end.toISOString();
  }
  return new Date(Date.now() + 86400000).toISOString();
}

export default function NewJobCardPage() {
  const router = useRouter();
  const { addJobCard, getNextJobNumber, updateJobCard } = useJobCardStore();
  const { services: highEndServices } = useHighEndServiceStore();
  const { addCustomer, updateCustomer, findByPhone, findByEmail, findByReferralCode, creditWallet, customers } =
    useCustomerStore();
  const { addTransaction } = useWalletStore();
  const { referralRewardAmount, newCustomerDiscount } = useSettingsStore();
  const { getBrandNames, getModels, getModelSegment } = useVehicleCatalogStore();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const setVehicles = useVehicleStore((s) => s.setVehicles);
  const staff = useStaffStore((s) => s.staff);
  const mechanics = useMemo(
    () => staff.filter((s) => s.role === "MECHANIC"),
    [staff]
  );

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [existingCustomerId, setExistingCustomerId] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleSegment, setVehicleSegment] = useState<VehicleSegment | "">("");
  const [mechanicId, setMechanicId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [deliveryDaysFromNow, setDeliveryDaysFromNow] = useState("");
  const [reportedIssues, setReportedIssues] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "Vehicle will be kept in secure parking. Not responsible for valuables left in vehicle. Warranty: 30 days on parts replaced."
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedHighEndIds, setSelectedHighEndIds] = useState<string[]>([]);
  const [highEndFirstFollowUpById, setHighEndFirstFollowUpById] = useState<Record<string, number>>({});
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInJob, setCheckInJob] = useState<{
    id: string;
    jobNumber: string;
    customerName: string;
    vehicleRegLabel: string;
  } | null>(null);
  const [checkInReportedIssuesBase, setCheckInReportedIssuesBase] = useState("");
  const [checkInNotesBase, setCheckInNotesBase] = useState("");
  const [checkInDamages, setCheckInDamages] = useState("");
  const [checkInNotesExtra, setCheckInNotesExtra] = useState("");
  const [checkInPhotos, setCheckInPhotos] = useState<{ id: string; url: string; label: string }[]>([]);
  const [checkInPhotoError, setCheckInPhotoError] = useState(false);
  const checkInFileRef = useRef<HTMLInputElement>(null);
  const checkInCameraRef = useRef<HTMLInputElement>(null);
  const checkInJobIdRef = useRef<string | null>(null);
  const brandNames = useMemo(() => getBrandNames(), [getBrandNames]);
  const brandModels = useMemo(() => vehicleBrand ? getModels(vehicleBrand) : [], [vehicleBrand, getModels]);
  const [referralCode, setReferralCode] = useState("");
  const [referrerInfo, setReferrerInfo] = useState<{ id: string; name: string } | null>(null);
  const [referralError, setReferralError] = useState(false);
  const prevMatchedCustomerIdRef = useRef<string | null>(null);

  const emailLooksComplete = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  useEffect(() => {
    const digits = customerPhone.replace(/\D/g, "").slice(-10);
    const emailTrim = customerEmail.trim();

    let found = digits.length === 10 ? findByPhone(customerPhone) : undefined;
    if (!found && emailLooksComplete(emailTrim)) {
      found = findByEmail(emailTrim);
    }

    if (!found) {
      prevMatchedCustomerIdRef.current = null;
      setExistingCustomerId(null);
      return;
    }

    const isNewMatch = prevMatchedCustomerIdRef.current !== found.id;
    prevMatchedCustomerIdRef.current = found.id;
    setExistingCustomerId(found.id);
    if (!isNewMatch) return;

    setCustomerName(found.name);
    const phone10 = found.phone.replace(/\D/g, "").slice(-10);
    if (phone10.length === 10) setCustomerPhone(phone10);
    setCustomerEmail(found.email || "");
    setCustomerAddress(found.address || "");

    const owned = vehicles.filter((v) => v.customerId === found.id);
    if (owned.length > 0) {
      const v = [...owned].sort((a, b) => a.registrationNumber.localeCompare(b.registrationNumber))[0];
      setVehicleNumber(v.registrationNumber);
      const resolvedBrand =
        brandNames.find((b) => b.toLowerCase() === v.make.toLowerCase()) ?? v.make;
      setVehicleBrand(resolvedBrand);
      setVehicleModel(v.model);
      setVehicleSegment(v.segment);
    }

  }, [customerPhone, customerEmail, findByPhone, findByEmail, brandNames, vehicles]);

  useEffect(() => {
    const code = referralCode.trim();
    if (!code) {
      setReferrerInfo(null);
      setReferralError(false);
      return;
    }
    const referrer = findByReferralCode(code);
    if (referrer) {
      setReferrerInfo({ id: referrer.id, name: referrer.name });
      setReferralError(false);
    } else {
      setReferrerInfo(null);
      setReferralError(true);
    }
  }, [referralCode]);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectedServices = useMemo(
    () => serviceCatalog.filter((s) => selectedServiceIds.includes(s.id)),
    [selectedServiceIds]
  );

  const estimatedAmount = useMemo(() => {
    return selectedServices.reduce((sum, s) => {
      if (vehicleSegment && s.segmentPricing) {
        return sum + (s.segmentPricing[vehicleSegment as keyof typeof s.segmentPricing] ?? s.defaultPrice);
      }
      return sum + s.defaultPrice;
    }, 0);
  }, [selectedServices, vehicleSegment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !vehicleNumber || !vehicleBrand || !vehicleSegment) {
      toast.error("Please fill all required fields");
      return;
    }
    if (selectedServiceIds.length === 0) {
      toast.error("Please select at least one service");
      return;
    }
    if (!isValidIndianVehicleRegistration(vehicleNumber)) {
      toast.error("Invalid vehicle registration number", { description: INDIAN_VEHICLE_REG_HINT });
      return;
    }

    const now = new Date().toISOString();
    const jobNumber = getNextJobNumber();
    const id = `jc-local-${Date.now()}`;
    const mechanic = mechanics.find((m) => m.id === mechanicId);

    const custId = existingCustomerId ?? `cust-local-${Date.now()}`;
    const regStored = normalizeRegistrationNumber(vehicleNumber);
    const formDigits = customerPhone.replace(/\D/g, "").slice(-10);

    const vehiclesNow = useVehicleStore.getState().vehicles;
    const sameReg = vehiclesNow.filter(
      (v) => normalizeRegistrationNumber(v.registrationNumber) === regStored
    );
    const forThisCustomer = sameReg.filter((v) => v.customerId === custId);
    const forOthers = sameReg.filter((v) => v.customerId !== custId);

    let matchedVehicle: Vehicle | undefined = forThisCustomer[0];

    if (!matchedVehicle && forOthers.length > 0) {
      const otherV = forOthers[0];
      const owner = customers.find((c) => c.id === otherV.customerId);
      const ownerDigits = owner ? owner.phone.replace(/\D/g, "").slice(-10) : "";
      const samePersonByPhone =
        formDigits.length === 10 && (!owner || ownerDigits === formDigits);
      const canRelink =
        Boolean(existingCustomerId) &&
        custId === existingCustomerId &&
        samePersonByPhone;

      if (!canRelink) {
        toast.error("This registration is already on file for another customer", {
          description: `${otherV.registrationNumber} is assigned to ${otherV.customerName}. Use that customer, or transfer ownership under Vehicles.`,
        });
        return;
      }
      matchedVehicle = otherV;
    }

    const newReferralCode = `REF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    if (!existingCustomerId) {
      const added = addCustomer({
        id: custId,
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        referralCode: newReferralCode,
        referredBy: referrerInfo ? referralCode.trim().toUpperCase() : undefined,
        totalVisits: 1,
        lastVisitDate: now,
        rewardPoints: 0,
        walletBalance: 0,
        createdAt: now,
      });
      if (!added) {
        toast.error("This phone number is already registered", {
          description: "Use the mobile field to load that customer, or enter a different number.",
        });
        return;
      }

      if (referrerInfo) {
        creditWallet(referrerInfo.id, referralRewardAmount);
        addTransaction({
          id: `wt-ref-${Date.now()}`,
          customerId: referrerInfo.id,
          customerName: referrerInfo.name,
          type: "CREDIT",
          amount: referralRewardAmount,
          source: "REFERRAL_REWARD",
          referenceId: custId,
          description: `Referral reward — ${customerName} used your code`,
          balanceAfter: 0,
          createdAt: now,
        });
        toast.success(`Referral applied!`, {
          description: `${referrerInfo.name} earned ${formatCurrency(referralRewardAmount)} wallet credit`,
        });
      }
    } else {
      const existing = customers.find((c) => c.id === existingCustomerId);
      updateCustomer(existingCustomerId, {
        totalVisits: (existing?.totalVisits ?? 0) + 1,
        lastVisitDate: now,
      });
    }

    const serviceItems = selectedServices.map((s) => {
      const price = vehicleSegment && s.segmentPricing
        ? (s.segmentPricing[vehicleSegment as keyof typeof s.segmentPricing] ?? s.defaultPrice)
        : s.defaultPrice;
      return {
        id: `si-${id}-${s.id}`,
        jobCardId: id,
        serviceCatalogId: s.id,
        name: s.name,
        price,
        isCompleted: false,
      };
    });

    const avgIncentive = selectedServices.length > 0
      ? selectedServices.reduce((sum, s) => sum + s.incentivePercent, 0) / selectedServices.length
      : 0;

    let resolvedVehicleId: string;
    if (matchedVehicle) {
      resolvedVehicleId = matchedVehicle.id;
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === matchedVehicle.id
            ? {
                ...v,
                customerId: custId,
                customerName: customerName.trim(),
                registrationNumber: regStored,
                make: vehicleBrand.trim(),
                model: vehicleModel.trim() || "—",
                segment: vehicleSegment as VehicleSegment,
              }
            : v
        )
      );
    } else {
      resolvedVehicleId = `veh-local-${Date.now()}`;
      const newVehicle: Vehicle = {
        id: resolvedVehicleId,
        customerId: custId,
        customerName: customerName.trim(),
        registrationNumber: regStored,
        make: vehicleBrand.trim(),
        model: vehicleModel.trim() || "—",
        segment: vehicleSegment as VehicleSegment,
        fuelType: "PETROL",
        color: "—",
        year: new Date().getFullYear(),
      };
      setVehicles((prev) => [newVehicle, ...prev]);
    }

    const newJobCard = {
      id,
      jobNumber,
      branchId: "br-001",
      customerId: custId,
      customerName,
      customerPhone,
      vehicleId: resolvedVehicleId,
      vehicleRegNumber: regStored,
      vehicleMakeModel: `${vehicleBrand} ${vehicleModel}`.trim(),
      vehicleSegment: vehicleSegment as VehicleSegment,
      mechanicId: mechanicId || undefined,
      mechanicName: mechanic?.name,
      status: "RECEIVED" as const,
      reportedIssues: reportedIssues || "—",
      odometerReading: odometerReading ? parseInt(odometerReading, 10) : undefined,
      expectedDelivery: resolveExpectedDeliveryIso(expectedDelivery, deliveryDaysFromNow),
      services: serviceItems,
      estimatedAmount,
      incentivePercent: Math.round(avgIncentive),
      incentiveAmount: Math.round(estimatedAmount * avgIncentive / 100),
      termsAndConditions,
      notes: notes || undefined,
      highEndServiceIds: selectedHighEndIds.length > 0 ? selectedHighEndIds : undefined,
      highEndFirstFollowUpMonthsByServiceId:
        selectedHighEndIds.length > 0
          ? Object.fromEntries(
              selectedHighEndIds.map((hesId) => {
                const cfg = highEndServices.find((h) => h.id === hesId);
                const months =
                  highEndFirstFollowUpById[hesId] ?? cfg?.reminderIntervals[0] ?? 0;
                return [hesId, months] as const;
              })
            )
          : undefined,
      createdBy: "USR-001",
      createdAt: now,
      updatedAt: now,
    };

    addJobCard(newJobCard);

    pushActivityLog({
      action: "CREATED",
      entityType: "JOB_CARD",
      entityId: id,
      entityLabel: jobNumber,
      details: `Job ${jobNumber} created for ${customerName} — ${vehicleNumber}`,
    });

    setCheckInJob({
      id,
      jobNumber,
      customerName,
      vehicleRegLabel: vehicleNumber.trim() || regStored,
    });
    setCheckInReportedIssuesBase(reportedIssues.trim() || "—");
    setCheckInNotesBase(notes.trim());
    setCheckInDamages("");
    setCheckInNotesExtra("");
    setCheckInPhotos([]);
    setCheckInPhotoError(false);
    checkInJobIdRef.current = id;
    setCheckInOpen(true);
    toast.message("Job card created", {
      description: "Complete vehicle check-in with before photos to open the job.",
    });
  };

  const dismissCheckIn = () => {
    const jid = checkInJobIdRef.current;
    checkInJobIdRef.current = null;
    setCheckInOpen(false);
    setCheckInJob(null);
    if (jid) router.push(`/job-cards/${jid}`);
  };

  const handleCheckInFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setCheckInPhotos((prev) => [
        ...prev,
        { id: `ph-ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, url, label: name || "Photo" },
      ]);
    });
    setCheckInPhotoError(false);
    if (checkInFileRef.current) checkInFileRef.current.value = "";
    if (checkInCameraRef.current) checkInCameraRef.current.value = "";
  };

  const removeCheckInPhoto = (photoId: string) => {
    setCheckInPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleCheckInSubmit = () => {
    if (!checkInJob) return;
    if (checkInPhotos.length === 0) {
      setCheckInPhotoError(true);
      return;
    }
    const damages = checkInDamages.trim();
    const extra = checkInNotesExtra.trim();
    let reported = checkInReportedIssuesBase;
    if (damages) {
      reported =
        reported === "—"
          ? `Check-in — observed damages: ${damages}`
          : `${reported}\n\nCheck-in — observed damages: ${damages}`;
    }
    let mergedNotes = checkInNotesBase;
    if (extra) {
      mergedNotes = mergedNotes ? `${mergedNotes}\n\nCheck-in notes: ${extra}` : `Check-in notes: ${extra}`;
    }
    const nowIso = new Date().toISOString();
    const photos: InspectionPhoto[] = checkInPhotos.map((p) => ({
      id: p.id,
      type: "BEFORE" as const,
      url: p.url,
      caption: p.label,
      uploadedAt: nowIso,
      uploadedBy: "USR-001",
    }));
    updateJobCard(checkInJob.id, {
      inspectionPhotos: photos,
      reportedIssues: reported,
      notes: mergedNotes || undefined,
      updatedAt: nowIso,
    });
    pushActivityLog({
      action: "UPDATED",
      entityType: "JOB_CARD",
      entityId: checkInJob.id,
      entityLabel: checkInJob.jobNumber,
      details: `Vehicle check-in — ${checkInPhotos.length} before photo(s)`,
    });
    toast.success("Vehicle checked in", { description: `${checkInJob.jobNumber} is ready for the workshop.` });
    const jid = checkInJob.id;
    checkInJobIdRef.current = null;
    setCheckInOpen(false);
    setCheckInJob(null);
    router.push(`/job-cards/${jid}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="New Job Card"
        actions={
          <Link href="/job-cards">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Mobile Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="Mobile number"
                  value={customerPhone}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "");
                    setCustomerPhone(d.slice(-10));
                  }}
                  maxLength={14}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  placeholder="Full address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>
            </div>

            {!existingCustomerId && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <Label htmlFor="referralCode" className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />
                    Have a referral code?
                  </Label>
                  <div className="flex items-center gap-2 max-w-sm">
                    <Input
                      id="referralCode"
                      placeholder="e.g. REF-A001"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  {referrerInfo && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Referred by <span className="font-medium">{referrerInfo.name}</span> — {formatCurrency(newCustomerDiscount)} discount will be applied
                    </p>
                  )}
                  {referralError && referralCode.trim() && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <XCircle className="w-3.5 h-3.5" />
                      Invalid referral code
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g. KA-01-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(sanitizeVehicleRegistrationInput(e.target.value))}
                  maxLength={16}
                  required
                  autoCapitalize="characters"
                />
                <p className="text-xs text-muted-foreground">{INDIAN_VEHICLE_REG_HINT}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleBrand">Brand *</Label>
                <Select value={vehicleBrand} onValueChange={(v) => { setVehicleBrand(v); setVehicleModel(""); }}>
                  <SelectTrigger id="vehicleBrand">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandNames.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Model</Label>
                {brandModels.length > 0 ? (
                  <Select value={vehicleModel} onValueChange={(v) => {
                    setVehicleModel(v);
                    const seg = getModelSegment(vehicleBrand, v);
                    if (seg) setVehicleSegment(seg);
                  }}>
                    <SelectTrigger id="vehicleModel">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandModels.map((m) => (
                        <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="vehicleModel"
                    placeholder={vehicleBrand ? "No models — type manually" : "Select brand first"}
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleSegment">Vehicle Segment *</Label>
                <Select value={vehicleSegment} onValueChange={(v) => setVehicleSegment(v as VehicleSegment)}>
                  <SelectTrigger id="vehicleSegment">
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-4">
              {serviceCatalog
                .filter((s) => s.isActive)
                .map((item: ServiceCatalogItem) => {
                  const price = vehicleSegment && item.segmentPricing
                    ? (item.segmentPricing[vehicleSegment as keyof typeof item.segmentPricing] ?? item.defaultPrice)
                    : item.defaultPrice;
                  return (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`svc-${item.id}`}
                        checked={selectedServiceIds.includes(item.id)}
                        onCheckedChange={() => toggleService(item.id)}
                      />
                      <label
                        htmlFor={`svc-${item.id}`}
                        className="text-sm leading-none cursor-pointer flex-1 flex items-center justify-between gap-1"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground text-xs shrink-0">{formatCurrency(price)}</span>
                      </label>
                    </div>
                  );
                })}
            </div>

            {selectedServices.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedServices.map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">{s.name}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Estimated Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(estimatedAmount)}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* High-End Services */}
        {highEndServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                High-End Services
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Select if this job includes premium services. Choose the first follow-up interval for each; further reminders use the rest of the schedule. Reminders are created when the job is delivered.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {highEndServices.map((hes) => {
                  const isSelected = selectedHighEndIds.includes(hes.id);
                  return (
                    <div
                      key={hes.id}
                      className={`rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-500"
                          : "border-border hover:border-amber-300 hover:bg-muted/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedHighEndIds((prev) =>
                            isSelected ? prev.filter((id) => id !== hes.id) : [...prev, hes.id]
                          )
                        }
                        className="flex items-start gap-2.5 p-3 w-full text-left"
                      >
                        <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-amber-500" : "text-muted-foreground"}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${isSelected ? "text-amber-700 dark:text-amber-400" : ""}`}>{hes.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Schedule: {hes.reminderIntervals.map((m) => formatHighEndIntervalMonths(m)).join(", ")}
                          </p>
                        </div>
                      </button>
                      {isSelected && hes.reminderIntervals.length > 0 && (
                        <div className="px-3 pb-3 pt-0 space-y-1.5 border-t border-amber-200/60 dark:border-amber-900/40">
                          <Label htmlFor={`hes-next-${hes.id}`} className="text-xs text-muted-foreground">
                            Next follow-up
                          </Label>
                          <Select
                            value={String(highEndFirstFollowUpById[hes.id] ?? hes.reminderIntervals[0])}
                            onValueChange={(v) => {
                              const months = Number.parseInt(v, 10);
                              setHighEndFirstFollowUpById((prev) => ({ ...prev, [hes.id]: months }));
                            }}
                          >
                            <SelectTrigger id={`hes-next-${hes.id}`} className="h-9 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {hes.reminderIntervals.map((m) => (
                                <SelectItem key={m} value={String(m)}>
                                  {formatHighEndIntervalMonths(m)} ({m} mo)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedHighEndIds.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {selectedHighEndIds.length} high-end service{selectedHighEndIds.length !== 1 ? "s" : ""} selected — reminders will be created automatically when this job is delivered.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mechanicId">Assign Mechanic</Label>
                <Select value={mechanicId} onValueChange={setMechanicId}>
                  <SelectTrigger id="mechanicId">
                    <SelectValue placeholder="Select mechanic" />
                  </SelectTrigger>
                  <SelectContent>
                    {mechanics.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="expectedDelivery">Expected delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="datetime-local"
                  value={expectedDelivery}
                  onChange={(e) => {
                    setExpectedDelivery(e.target.value);
                    if (e.target.value) setDeliveryDaysFromNow("");
                  }}
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
                  <span className="text-sm text-muted-foreground">or in</span>
                  <Input
                    id="deliveryDaysFromNow"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="days"
                    className="w-24"
                    value={deliveryDaysFromNow}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDeliveryDaysFromNow(v);
                      if (v.trim() !== "") setExpectedDelivery("");
                    }}
                  />
                  <span className="text-sm text-muted-foreground">days (6:00 PM that day)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometerReading">Odometer Reading</Label>
                <Input
                  id="odometerReading"
                  type="number"
                  placeholder="e.g. 25000"
                  value={odometerReading}
                  onChange={(e) => setOdometerReading(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportedIssues">Reported Issues</Label>
              <Textarea
                id="reportedIssues"
                placeholder="Describe the issues reported by the customer"
                value={reportedIssues}
                onChange={(e) => setReportedIssues(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
              <Textarea
                id="termsAndConditions"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Internal notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/job-cards">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit">Create Job Card</Button>
        </div>
      </form>

      <Dialog
        open={checkInOpen}
        onOpenChange={(open) => {
          if (!open) dismissCheckIn();
        }}
      >
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0"
          showClose={false}
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <DialogTitle className="text-xl">Vehicle Check-In</DialogTitle>
                <DialogDescription className="mt-2 text-left">
                  Capture before photos to document the vehicle condition. You need at least one photo to
                  finish check-in and open the job card.
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 -mr-1"
                aria-label="Close"
                onClick={() => dismissCheckIn()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {checkInJob && (
              <div className="mt-4 grid gap-1.5 text-sm rounded-lg bg-muted/50 p-3 border border-border/80">
                <p>
                  <span className="text-muted-foreground">Job </span>
                  <span className="font-mono font-semibold">{checkInJob.jobNumber}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Customer </span>
                  <span className="font-medium">{checkInJob.customerName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Reg. number </span>
                  <span className="font-mono font-semibold tracking-wide">{checkInJob.vehicleRegLabel}</span>
                </p>
              </div>
            )}
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
            <div className="space-y-2">
              <Label className="text-base">
                Before Photos <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={checkInCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleCheckInFiles}
                />
                <input
                  ref={checkInFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleCheckInFiles}
                />
                <Button
                  type="button"
                  onClick={() => checkInCameraRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => checkInFileRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photos
                </Button>
              </div>
              {checkInPhotoError && (
                <p className="text-sm text-destructive rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                  Required: Please upload at least one before photo of the vehicle
                </p>
              )}
              <p className="text-xs text-muted-foreground">Upload photos of the vehicle from all sides as needed.</p>
              {checkInPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {checkInPhotos.map((p) => (
                    <div key={p.id} className="relative group w-20 h-20 rounded-md overflow-hidden border bg-muted">
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5 shadow border opacity-90 hover:opacity-100"
                        onClick={() => removeCheckInPhoto(p.id)}
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="check-in-damages">Initial damages (optional)</Label>
              <Textarea
                id="check-in-damages"
                placeholder="Note any minor damages observed…"
                value={checkInDamages}
                onChange={(e) => setCheckInDamages(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check-in-notes">Check-in notes (optional)</Label>
              <Textarea
                id="check-in-notes"
                placeholder="Additional notes from check-in process…"
                value={checkInNotesExtra}
                onChange={(e) => setCheckInNotesExtra(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20 shrink-0">
            <Button type="button" variant="outline" onClick={() => dismissCheckIn()}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCheckInSubmit}>
              Check In Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
