"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Car, Pencil, Plus, Star, MessageSquare, Wallet, Copy, Share2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { JobCardStatusBadge, InvoiceStatusBadge } from "@/components/shared/status-badge";
import {
  vehicles,
  jobCards,
  invoices,
} from "@/lib/mock-data";
import { useCustomerStore } from "@/store/customer-store";
import { useWalletStore } from "@/store/wallet-store";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { Customer, Vehicle, JobCard, Invoice, WalletTransaction } from "@/types";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { customers: allCustomers, updateCustomer } = useCustomerStore();
  const customer = useMemo(() => {
    return allCustomers.find((c) => c.id === id) ?? null;
  }, [id, allCustomers]);

  const customerVehicles = useMemo(() => {
    return vehicles.filter((v) => v.customerId === id);
  }, [id]);

  const customerJobCards = useMemo(() => {
    return jobCards.filter((jc) => jc.customerId === id);
  }, [id]);

  const customerInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.customerId === id);
  }, [id]);

  const { getByCustomer } = useWalletStore();
  const customerWalletTransactions = useMemo(() => {
    return getByCustomer(id);
  }, [id, getByCustomer]);

  const referralCount = useMemo(() => {
    return allCustomers.filter((c) => c.referredBy === customer?.referralCode).length;
  }, [id, customer?.referralCode]);

  const normalizeJobCardStatus = (status: string) => {
    return status as JobCard["status"];
  };

  const getPaymentMethod = (inv: Invoice) => {
    if (inv.payments.length === 0) return "—";
    const method = inv.payments[0].method;
    return method === "UPI" ? "UPI" : method === "CARD" ? "Card" : "Cash";
  };

  const handleCopyReferralCode = () => {
    if (customer?.referralCode) {
      navigator.clipboard.writeText(customer.referralCode);
      toast.success("Referral code copied to clipboard");
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const startEditing = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditEmail(customer.email);
    setEditAddress(customer.address || "");
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const saveEditing = () => {
    if (!editName.trim() || !editPhone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    updateCustomer(id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      address: editAddress.trim(),
    });
    setIsEditing(false);
    toast.success("Customer updated successfully");
  };

  const handleShareViaWhatsApp = () => {
    if (customer?.referralCode) {
      const text = encodeURIComponent(
        `Use my referral code ${customer.referralCode} at Prime Detailers for exclusive benefits!`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
      toast.success("Opening WhatsApp to share");
    }
  };

  if (!customer) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Button variant="ghost" onClick={() => router.push("/customers")} asChild>
          <Link href="/customers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs items={[
        { label: "Customers", href: "/customers" },
        { label: customer.name },
      ]} />

      {customer.isInactive && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">This customer is marked as inactive (no visit in 90+ days).</p>
        </div>
      )}

      <Card className="border-border">
        <CardContent className="!p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Avatar className="h-16 w-16 shrink-0 mt-1">
              <AvatarFallback className="text-lg">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                <p className="text-muted-foreground mt-1">{customer.phone}</p>
                <p className="text-muted-foreground">{customer.email}</p>
                {customer.address && (
                  <p className="text-muted-foreground mt-1">{customer.address}</p>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">
                    Wallet Balance
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-primary" />
                    <p className="font-bold text-base">{formatCurrency(customer.walletBalance)}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">
                    Member Since
                  </span>
                  <p className="font-semibold text-sm">{formatDate(customer.createdAt)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">
                    Last Visit
                  </span>
                  <p className="font-semibold text-sm">{customer.lastVisitDate ? formatDate(customer.lastVisitDate) : "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">
                    Referral Code
                  </span>
                  <div className="flex items-center gap-1">
                    <p className="font-mono font-semibold text-sm">{customer.referralCode}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyReferralCode}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleShareViaWhatsApp}>
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {referralCount > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {referralCount} {referralCount === 1 ? "person" : "people"} used this code
                    </p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium block mb-1">
                    Reward Points
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500" />
                    <p className="font-bold text-base">{customer.rewardPoints}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-muted/50 w-full sm:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="service-history">Service History</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Customer Information</CardTitle>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                  <Button size="sm" onClick={saveEditing}>Save</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  {isEditing ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    <p className="font-medium">{customer.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  {isEditing ? (
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  ) : (
                    <p className="font-medium">{customer.phone}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  {isEditing ? (
                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  ) : (
                    <p className="font-medium">{customer.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  {isEditing ? (
                    <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                  ) : (
                    <p className="font-medium">{customer.address || "—"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referral Code</p>
                  <p className="font-mono font-medium">{customer.referralCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Visits</p>
                  <p className="font-medium">{customer.totalVisits}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Visit</p>
                  <p className="font-medium">{customer.lastVisitDate ? formatDate(customer.lastVisitDate) : "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                  <p className="font-medium">{formatCurrency(customer.walletBalance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reward Points</p>
                  <p className="font-medium">{customer.rewardPoints}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Vehicles</CardTitle>
              <Button variant="outline" size="sm" disabled>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              {customerVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No vehicles registered
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customerVehicles.map((vehicle: Vehicle) => (
                    <Link
                      key={vehicle.id}
                      href={`/vehicles/${vehicle.id}`}
                      className="block"
                    >
                      <Card className="hover:bg-muted/50 transition-colors border-border cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-muted p-2">
                              <Car className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono font-semibold text-sm">
                                {vehicle.registrationNumber}
                              </p>
                              <p className="text-sm font-medium mt-1">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {vehicle.fuelType} &middot; {vehicle.year} &middot;{" "}
                                {vehicle.color}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerWalletTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No wallet transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {customerWalletTransactions.map((wt: WalletTransaction) => (
                    <div
                      key={wt.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={wt.type === "CREDIT" ? "default" : "secondary"}>
                            {wt.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {wt.type === "CREDIT" ? "+" : "-"}
                            {formatCurrency(wt.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{wt.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Source: {wt.source.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Balance: {formatCurrency(wt.balanceAfter)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(wt.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service History</CardTitle>
            </CardHeader>
            <CardContent>
              {customerJobCards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No service history
                </p>
              ) : (
                <div className="space-y-3">
                  {customerJobCards.map((jc: JobCard) => (
                    <Link
                      key={jc.id}
                      href={`/job-cards/${jc.id}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {jc.jobNumber}
                          </span>
                          <JobCardStatusBadge status={normalizeJobCardStatus(jc.status)} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {jc.vehicleRegNumber} &middot; {jc.vehicleMakeModel}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {jc.services.map((s) => s.name).join(", ")}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground sm:ml-4">
                        {formatDate(jc.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {customerInvoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No invoices
                </p>
              ) : (
                <div className="space-y-3">
                  {customerInvoices.map((inv: Invoice) => (
                    <Link
                      key={inv.id}
                      href={`/billing/${inv.id}`}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {inv.invoiceNumber}
                          </span>
                          <InvoiceStatusBadge status={inv.status} />
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          {formatCurrency(inv.grandTotal)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Payment: {getPaymentMethod(inv)}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground sm:ml-4">
                        {formatDate(inv.createdAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="feedback" className="space-y-4">
          <CustomerFeedback customerId={id} customerJobCards={customerJobCards} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const MOCK_FEEDBACKS = [
  { id: "fb-1", jobCardId: "jc-019", jobNumber: "JC-2026-0019", rating: 5, comment: "Excellent service! Car feels brand new. Murugan was very professional.", createdAt: "2026-03-10T17:00:00Z" },
  { id: "fb-2", jobCardId: "jc-022", jobNumber: "JC-2026-0022", rating: 4, comment: "Good work on the brakes. Took a bit longer than expected but quality is great.", createdAt: "2026-03-07T18:00:00Z" },
  { id: "fb-3", jobCardId: "jc-023", jobNumber: "JC-2026-0023", rating: 5, comment: "Always happy with the service here. Will keep coming back!", createdAt: "2026-03-06T17:00:00Z" },
];

function StarRating({ rating, onRate, size = "md" }: { rating: number; onRate?: (r: number) => void; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate?.(star)}
          className={`${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          type="button"
        >
          <Star
            className={`${dim} ${star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function CustomerFeedback({ customerId, customerJobCards }: { customerId: string; customerJobCards: JobCard[] }) {
  const [feedbacks, setFeedbacks] = useState(MOCK_FEEDBACKS);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showForm, setShowForm] = useState(false);

  const avgRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

  const handleSubmit = () => {
    if (newRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setFeedbacks((prev) => [
      { id: `fb-${Date.now()}`, jobCardId: "", jobNumber: "General", rating: newRating, comment: newComment, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setNewRating(0);
    setNewComment("");
    setShowForm(false);
    toast.success("Feedback submitted");
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="!p-5 text-center">
            <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
            <StarRating rating={Math.round(avgRating)} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">{feedbacks.length} reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-5 text-center flex flex-col items-center justify-center h-full">
            <p className="text-3xl font-bold">{feedbacks.filter((f) => f.rating >= 4).length}</p>
            <p className="text-sm text-muted-foreground">Positive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="!p-5 flex items-center justify-center h-full">
            <Button onClick={() => setShowForm(!showForm)} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Feedback
            </Button>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Rating</p>
              <StarRating rating={newRating} onRate={setNewRating} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Comment (optional)</p>
              <Textarea
                placeholder="Share your experience..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>Submit</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback History</CardTitle>
        </CardHeader>
        <CardContent>
          {feedbacks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No feedback yet</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <StarRating rating={fb.rating} size="sm" />
                    <span className="text-xs text-muted-foreground">{formatDate(fb.createdAt)}</span>
                  </div>
                  {fb.comment && <p className="text-sm">{fb.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">Job: {fb.jobNumber}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
