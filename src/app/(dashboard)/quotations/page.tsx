"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { KPICard } from "@/components/shared/kpi-card";
import { QuotationStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  quotations,
  customers,
  vehicles,
  serviceCatalog,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Quotation, QuotationStatus, VehicleSegment } from "@/types";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRightCircle,
  MoreHorizontal,
  MessageCircle,
  ClipboardList,
  Eye,
  ChevronRight,
} from "lucide-react";

const TAB_VALUES: (QuotationStatus | "ALL")[] = [
  "ALL",
  "DRAFT",
  "SENT",
  "APPROVED",
  "REJECTED",
  "CONVERTED",
];

const TAB_LABELS: Record<QuotationStatus | "ALL", string> = {
  ALL: "All",
  DRAFT: "Draft",
  SENT: "Sent",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted",
};

const TAX_RATE = 0.18;

function getServicePrice(serviceId: string, segment: VehicleSegment): number {
  const svc = serviceCatalog.find((s) => s.id === serviceId);
  if (!svc) return 0;
  const price = svc.segmentPricing[segment];
  return price ?? svc.defaultPrice;
}

export default function QuotationsPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [quotationList, setQuotationList] = useState<Quotation[]>(quotations);

  // New quotation form state
  const [formCustomerId, setFormCustomerId] = useState<string>("");
  const [formVehicleId, setFormVehicleId] = useState<string>("");
  const [formServiceIds, setFormServiceIds] = useState<Set<string>>(new Set());
  const [formTerms, setFormTerms] = useState("");

  const customerVehicles = useMemo(() => {
    if (!formCustomerId) return [];
    return vehicles.filter((v) => v.customerId === formCustomerId);
  }, [formCustomerId]);

  const selectedVehicle = useMemo(() => {
    if (!formVehicleId) return null;
    return vehicles.find((v) => v.id === formVehicleId);
  }, [formVehicleId]);

  const formCalculations = useMemo(() => {
    const segment = selectedVehicle?.segment ?? "HATCHBACK";
    let subtotal = 0;
    formServiceIds.forEach((sid) => {
      subtotal += getServicePrice(sid, segment);
    });
    const taxAmount = Math.round(subtotal * TAX_RATE);
    const grandTotal = subtotal + taxAmount;
    return { subtotal, taxAmount, grandTotal };
  }, [formServiceIds, selectedVehicle?.segment]);

  const filteredQuotations = useMemo(() => {
    if (activeTab === "ALL") return quotationList;
    return quotationList.filter((q) => q.status === activeTab);
  }, [quotationList, activeTab]);

  const kpis = useMemo(() => {
    const total = quotationList.length;
    const pendingApproval = quotationList.filter(
      (q) => q.status === "SENT"
    ).length;
    const approved = quotationList.filter((q) => q.status === "APPROVED").length;
    const converted = quotationList.filter(
      (q) => q.status === "CONVERTED"
    ).length;
    return { total, pendingApproval, approved, converted };
  }, [quotationList]);

  const resetForm = () => {
    setFormCustomerId("");
    setFormVehicleId("");
    setFormServiceIds(new Set());
    setFormTerms("");
  };

  const handleNewQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerId || !formVehicleId || formServiceIds.size === 0) {
      toast.error("Please select customer, vehicle, and at least one service");
      return;
    }
    const customer = customers.find((c) => c.id === formCustomerId);
    const vehicle = vehicles.find((v) => v.id === formVehicleId);
    if (!customer || !vehicle) return;

    const newQuotation: Quotation = {
      id: `quot-${Date.now()}`,
      quotationNumber: `QUO-2026-${String(quotationList.length + 1).padStart(4, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleId: vehicle.id,
      vehicleRegNumber: vehicle.registrationNumber,
      vehicleMakeModel: `${vehicle.make} ${vehicle.model}`,
      vehicleSegment: vehicle.segment,
      services: Array.from(formServiceIds).map((sid) => {
        const svc = serviceCatalog.find((s) => s.id === sid)!;
        const price = getServicePrice(sid, vehicle.segment);
        return { serviceCatalogId: sid, name: svc.name, price };
      }),
      subtotal: formCalculations.subtotal,
      taxRate: TAX_RATE,
      taxAmount: formCalculations.taxAmount,
      grandTotal: formCalculations.grandTotal,
      status: "DRAFT",
      sentViaWhatsApp: false,
      termsAndConditions: formTerms || undefined,
      validUntil: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      createdBy: "usr-004",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuotationList((prev) => [newQuotation, ...prev]);
    toast.success("Quotation created", {
      description: `${newQuotation.quotationNumber} has been saved as draft.`,
    });
    setNewDialogOpen(false);
    resetForm();
  };

  const handleSendWhatsApp = (q: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Quotation sent via WhatsApp", {
      description: `Estimate sent to ${q.customerName} at ${q.customerPhone}`,
    });
  };

  const handleConvertToJobCard = (q: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success("Converted to Job Card", {
      description: `Quotation ${q.quotationNumber} has been converted.`,
    });
  };

  const handleViewDetails = (q: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedQuotation(q);
    setDetailsDialogOpen(true);
  };

  const toggleService = (serviceId: string) => {
    setFormServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const columns = [
    {
      key: "quotationNumber",
      label: "Quotation #",
      render: (item: Quotation) => (
        <span className="font-mono font-medium">{item.quotationNumber}</span>
      ),
      className: "font-mono",
    },
    {
      key: "customer",
      label: "Customer",
      render: (item: Quotation) => (
        <div>
          <div className="font-medium">{item.customerName}</div>
          <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (item: Quotation) => (
        <div>
          <div className="font-medium">{item.vehicleRegNumber}</div>
          <div className="text-xs text-muted-foreground">
            {item.vehicleMakeModel}
          </div>
        </div>
      ),
    },
    {
      key: "services",
      label: "Services",
      render: (item: Quotation) => (
        <span className="text-muted-foreground line-clamp-2 max-w-[180px]">
          {item.services.map((s) => s.name).join(", ")}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (item: Quotation) => (
        <span className="font-semibold">{formatCurrency(item.grandTotal)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: Quotation) => <QuotationStatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Quotation) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => handleViewDetails(item, e)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {item.status !== "CONVERTED" && item.status !== "REJECTED" && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => handleSendWhatsApp(item, e)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send via WhatsApp
                  </DropdownMenuItem>
                  {(item.status === "APPROVED" || item.status === "SENT") && (
                    <DropdownMenuItem
                      onClick={(e) => handleConvertToJobCard(item, e)}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Convert to Job Card
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { ALL: quotationList.length };
    quotationList.forEach((q) => {
      c[q.status] = (c[q.status] ?? 0) + 1;
    });
    return c;
  }, [quotationList]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Quotations & Estimates"
        description="Create and manage quotations, send estimates via WhatsApp, and convert to job cards"
        actions={
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        }
      />

      {/* Conversion flow pipeline */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Quotation</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Job Card</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <ArrowRightCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Invoice</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Quotations"
          value={kpis.total}
          icon={FileText}
        />
        <KPICard
          title="Pending Approval"
          value={kpis.pendingApproval}
          icon={Clock}
        />
        <KPICard
          title="Approved"
          value={kpis.approved}
          icon={CheckCircle2}
        />
        <KPICard
          title="Converted to Job Card"
          value={kpis.converted}
          icon={ArrowRightCircle}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TAB_VALUES.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]} ({tabCounts[tab] ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_VALUES.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <DataTable<Quotation>
              data={
                tab === "ALL"
                  ? quotationList
                  : quotationList.filter((q) => q.status === tab)
              }
              columns={columns}
              searchPlaceholder="Search by quotation #, customer, or vehicle..."
              searchKeys={[
                "quotationNumber",
                "customerName",
                "vehicleRegNumber",
                "vehicleMakeModel",
              ]}
              pageSize={10}
              onRowClick={(item) => {
                setSelectedQuotation(item);
                setDetailsDialogOpen(true);
              }}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* New Quotation Dialog */}
      <Dialog
        open={newDialogOpen}
        onOpenChange={(open) => {
          setNewDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quotation</DialogTitle>
            <DialogDescription>
              Create a new quotation for a customer. Select customer, vehicle, and services.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNewQuotationSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select
                  value={formCustomerId}
                  onValueChange={(v) => {
                    setFormCustomerId(v);
                    setFormVehicleId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select
                  value={formVehicleId}
                  onValueChange={setFormVehicleId}
                  disabled={!formCustomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerVehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registrationNumber} — {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Services</Label>
              <div className="rounded-lg border border-border p-3 max-h-48 overflow-y-auto space-y-2">
                {serviceCatalog.filter((s) => s.isActive).map((svc) => {
                  const price = selectedVehicle
                    ? getServicePrice(svc.id, selectedVehicle.segment)
                    : svc.defaultPrice;
                  return (
                    <div
                      key={svc.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`svc-${svc.id}`}
                        checked={formServiceIds.has(svc.id)}
                        onCheckedChange={() => toggleService(svc.id)}
                        disabled={!formVehicleId}
                      />
                      <label
                        htmlFor={`svc-${svc.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {svc.name}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(formCalculations.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span>{formatCurrency(formCalculations.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Grand Total</span>
                <span>{formatCurrency(formCalculations.grandTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Terms & Conditions</Label>
              <Textarea
                placeholder="Payment terms, warranty, etc."
                value={formTerms}
                onChange={(e) => setFormTerms(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Quotation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedQuotation?.quotationNumber ?? "Quotation Details"}
            </DialogTitle>
            <DialogDescription>
              Full quotation details and status
            </DialogDescription>
          </DialogHeader>
          {selectedQuotation && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <QuotationStatusBadge status={selectedQuotation.status} />
                <span className="text-sm text-muted-foreground">
                  Valid until {format(new Date(selectedQuotation.validUntil), "dd MMM yyyy")}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedQuotation.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedQuotation.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{selectedQuotation.vehicleRegNumber}</p>
                  <p className="text-sm text-muted-foreground">{selectedQuotation.vehicleMakeModel}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Services</p>
                <ul className="space-y-1">
                  {selectedQuotation.services.map((s) => (
                    <li key={s.serviceCatalogId} className="flex justify-between text-sm">
                      <span>{s.name}</span>
                      <span>{formatCurrency(s.price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-border space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedQuotation.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (18%)</span>
                  <span>{formatCurrency(selectedQuotation.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedQuotation.grandTotal)}</span>
                </div>
              </div>
              {selectedQuotation.convertedToJobCardId && (
                <div className="pt-2">
                  <Link href={`/job-cards/${selectedQuotation.convertedToJobCardId}`}>
                    <Button variant="outline" size="sm">
                      View Job Card
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
