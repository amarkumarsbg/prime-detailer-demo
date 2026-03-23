"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Ticket, CheckCircle2, XCircle } from "lucide-react";
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
import { serviceCatalog } from "@/lib/mock-data";
import { useVehicleStore } from "@/store/vehicle-store";
import { useJobCardStore } from "@/store/job-card-store";
import { useStaffStore } from "@/store/staff-store";
import { useHighEndServiceStore } from "@/store/high-end-service-store";
import { useCustomerStore } from "@/store/customer-store";
import { useWalletStore } from "@/store/wallet-store";
import { useSettingsStore } from "@/store/settings-store";
import { useVehicleCatalogStore } from "@/store/vehicle-catalog-store";
import { formatCurrency } from "@/lib/utils";
import type { Vehicle, VehicleSegment, ServiceCatalogItem } from "@/types";

const SEGMENT_OPTIONS: { value: VehicleSegment; label: string }[] = [
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "COMPACT_SUV", label: "Compact SUV" },
  { value: "MUV", label: "MUV" },
  { value: "LUXURY", label: "Luxury" },
];


export default function NewJobCardPage() {
  const router = useRouter();
  const { addJobCard, getNextJobNumber } = useJobCardStore();
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
  const [reportedIssues, setReportedIssues] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [notes, setNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "Vehicle will be kept in secure parking. Not responsible for valuables left in vehicle. Warranty: 30 days on parts replaced."
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedHighEndIds, setSelectedHighEndIds] = useState<string[]>([]);
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

    const now = new Date().toISOString();
    const jobNumber = getNextJobNumber();
    const id = `jc-local-${Date.now()}`;
    const mechanic = mechanics.find((m) => m.id === mechanicId);

    const custId = existingCustomerId ?? `cust-local-${Date.now()}`;

    const newReferralCode = `REF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    if (!existingCustomerId) {
      addCustomer({
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

    const regUpper = vehicleNumber.trim().toUpperCase();
    const latestVehicles = useVehicleStore.getState().vehicles;
    const matchedVehicle = latestVehicles.find(
      (v) => v.customerId === custId && v.registrationNumber === regUpper
    );

    let resolvedVehicleId: string;
    if (matchedVehicle) {
      resolvedVehicleId = matchedVehicle.id;
    } else {
      resolvedVehicleId = `veh-local-${Date.now()}`;
      const newVehicle: Vehicle = {
        id: resolvedVehicleId,
        customerId: custId,
        customerName: customerName.trim(),
        registrationNumber: regUpper,
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
      vehicleRegNumber: vehicleNumber,
      vehicleMakeModel: `${vehicleBrand} ${vehicleModel}`.trim(),
      vehicleSegment: vehicleSegment as VehicleSegment,
      mechanicId: mechanicId || undefined,
      mechanicName: mechanic?.name,
      status: "RECEIVED" as const,
      reportedIssues: reportedIssues || "—",
      odometerReading: odometerReading ? parseInt(odometerReading, 10) : undefined,
      expectedDelivery: expectedDelivery || new Date(Date.now() + 86400000).toISOString(),
      services: serviceItems,
      estimatedAmount,
      incentivePercent: Math.round(avgIncentive),
      incentiveAmount: Math.round(estimatedAmount * avgIncentive / 100),
      termsAndConditions,
      notes: notes || undefined,
      highEndServiceIds: selectedHighEndIds.length > 0 ? selectedHighEndIds : undefined,
      createdBy: "USR-001",
      createdAt: now,
      updatedAt: now,
    };

    addJobCard(newJobCard);

    toast.success("Job card created successfully", {
      description: `${jobNumber} for ${customerName} — ${vehicleNumber} saved locally.`,
    });
    router.push("/job-cards");
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
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  required
                />
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
                Select if this job includes premium services. Maintenance reminders will be auto-generated on delivery.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {highEndServices.map((hes) => {
                  const isSelected = selectedHighEndIds.includes(hes.id);
                  return (
                    <button
                      key={hes.id}
                      type="button"
                      onClick={() =>
                        setSelectedHighEndIds((prev) =>
                          isSelected ? prev.filter((id) => id !== hes.id) : [...prev, hes.id]
                        )
                      }
                      className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-500"
                          : "border-border hover:border-amber-300 hover:bg-muted/50"
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-amber-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? "text-amber-700 dark:text-amber-400" : ""}`}>{hes.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Reminders: {hes.reminderIntervals.map((m) => m >= 12 ? `${m / 12}yr` : `${m}mo`).join(", ")}
                        </p>
                      </div>
                    </button>
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
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                <Input
                  id="expectedDelivery"
                  type="datetime-local"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
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
    </div>
  );
}
