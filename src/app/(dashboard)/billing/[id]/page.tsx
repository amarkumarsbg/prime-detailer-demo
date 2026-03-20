"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  MessageCircle,
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { invoices, jobCards } from "@/lib/mock-data";
import { useCustomerStore } from "@/store/customer-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import type { Invoice, Payment, PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "UPI", label: "UPI", icon: Smartphone },
  { value: "CARD", label: "Card", icon: CreditCard },
];

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const config = PAYMENT_METHODS.find((m) => m.value === method);
  const Icon = config?.icon ?? Banknote;
  return (
    <Badge variant="outline" className="gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {config?.label ?? method}
    </Badge>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const invoice = useMemo(
    () => invoices.find((inv) => inv.id === id),
    [id]
  );

  const jobCard = useMemo(
    () => (invoice ? jobCards.find((jc) => jc.id === invoice.jobCardId) : null),
    [invoice]
  );

  const { customers } = useCustomerStore();
  const { referralRewardAmount, newCustomerDiscount } = useSettingsStore();

  const invoiceCustomer = useMemo(
    () => (invoice ? customers.find((c) => c.id === invoice.customerId) : null),
    [invoice, customers]
  );

  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (invoice) setPayments(invoice.payments);
  }, [invoice?.id]);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + p.amount, 0),
    [payments]
  );
  const remainingBalance = invoice ? invoice.grandTotal - totalPaid : 0;

  const openRecordDialog = () => {
    setPaymentAmount(remainingBalance > 0 ? String(remainingBalance) : "");
    setPaymentMethod("CASH");
    setReferenceNumber("");
    setRecordDialogOpen(true);
  };

  const handleRecordPayment = () => {
    const amount = Number(paymentAmount);
    if (!invoice || isNaN(amount) || amount <= 0) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      invoiceId: invoice.id,
      amount,
      method: paymentMethod,
      referenceNumber: referenceNumber || undefined,
      paidAt: new Date().toISOString(),
    };
    setPayments((prev) => [...prev, newPayment]);
    setRecordDialogOpen(false);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { window.print(); return; }

    const vehicleMakeModel = jobCard?.vehicleMakeModel ?? "—";
    const statusLabel = invoice?.status === "PAID" ? "PAID" : invoice?.status === "PARTIALLY_PAID" ? "PARTIAL" : invoice?.status ?? "";
    const statusColor = invoice?.status === "PAID" ? "#16a34a" : invoice?.status === "PARTIALLY_PAID" ? "#d97706" : "#6366f1";

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice?.invoiceNumber ?? ""}</title>
<style>
@page { margin: 0; size: A4; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #fff; }
.page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
.brand-bar { height: 6px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7); }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 32px; margin-bottom: 32px; }
.logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #6366f1; }
.logo span { color: #1a1a2e; }
.company-info { font-size: 11px; color: #64748b; line-height: 1.6; margin-top: 6px; }
.invoice-badge { text-align: right; }
.invoice-title { font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #1a1a2e; }
.invoice-num { font-size: 14px; font-family: 'SF Mono', 'Fira Code', monospace; color: #6366f1; font-weight: 600; margin-top: 4px; }
.status-pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #fff; background: ${statusColor}; margin-top: 8px; }
.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 20px 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
.meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 4px; }
.meta-value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
.meta-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
thead th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; padding: 12px 16px; border-bottom: 2px solid #e2e8f0; text-align: left; }
thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
tbody td { padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(4) { text-align: right; }
tbody td:last-child { font-weight: 600; color: #1a1a2e; }
.type-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; background: #ede9fe; color: #6366f1; }
.totals-box { margin-left: auto; max-width: 320px; }
.totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #64748b; }
.totals-row span:last-child { color: #1a1a2e; font-weight: 500; }
.totals-divider { border-top: 2px solid #1a1a2e; margin-top: 8px; padding-top: 12px; }
.grand-total { font-size: 20px; font-weight: 800; color: #1a1a2e; }
.grand-total span:last-child { color: #6366f1; }
.payments-section { margin-top: 32px; padding: 20px 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
.payments-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; margin-bottom: 12px; }
.payment-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
.payment-row:last-child { border-bottom: none; }
.payment-method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e0f2fe; color: #0284c7; }
.balance-row { display: flex; justify-content: space-between; padding: 10px 0; margin-top: 8px; border-top: 1px dashed #cbd5e1; font-weight: 700; color: #d97706; font-size: 14px; }
.footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
.footer-thanks { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px; }
.footer-sub { font-size: 11px; color: #94a3b8; }
.footer-brand { font-size: 10px; color: #cbd5e1; margin-top: 12px; }
@media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .page { padding: 32px 40px; } }
</style></head><body>
<div class="brand-bar"></div>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">Prime<span>Detailers</span></div>
      <div class="company-info">
        80 Feet Road, Koramangala 4th Block<br>
        Bengaluru, Karnataka 560034<br>
        +91-80-4123-4567 &bull; hello@primedetailers.in<br>
        GSTIN: 29AABCT1234F1ZP
      </div>
    </div>
    <div class="invoice-badge">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-num">${invoice?.invoiceNumber ?? ""}</div>
      <div class="status-pill">${statusLabel}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-label">Bill To</div>
      <div class="meta-value">${invoice?.customerName ?? ""}</div>
      <div class="meta-sub">${invoice?.customerPhone ?? ""}</div>
    </div>
    <div>
      <div class="meta-label">Vehicle</div>
      <div class="meta-value">${invoice?.vehicleRegNumber ?? ""}</div>
      <div class="meta-sub">${vehicleMakeModel}</div>
    </div>
    <div>
      <div class="meta-label">Invoice Date</div>
      <div class="meta-value">${invoice ? formatDate(invoice.createdAt) : ""}</div>
    </div>
    <div>
      <div class="meta-label">Job Card</div>
      <div class="meta-value">${invoice?.jobNumber ?? ""}</div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th>Type</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
    <tbody>${invoice?.lineItems.map((li, i) => `
      <tr>
        <td>${li.description}</td>
        <td><span class="type-tag">${li.type}</span></td>
        <td style="text-align:right">${li.quantity}</td>
        <td style="text-align:right">${formatCurrency(li.unitPrice)}</td>
        <td style="text-align:right">${formatCurrency(li.total)}</td>
      </tr>`).join("") ?? ""}</tbody>
  </table>

  <div class="totals-box">
    <div class="totals-row"><span>Subtotal</span><span>${invoice ? formatCurrency(invoice.subtotal) : ""}</span></div>
    <div class="totals-row"><span>Tax (${invoice ? Math.round(invoice.taxRate * 100) : 0}%)</span><span>${invoice ? formatCurrency(invoice.taxAmount) : ""}</span></div>
    ${(invoice?.discountAmount ?? 0) > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatCurrency(invoice!.discountAmount)}</span></div>` : ""}
    ${(invoice?.rewardDiscount ?? 0) > 0 ? `<div class="totals-row"><span>Reward Discount</span><span>-${formatCurrency(invoice!.rewardDiscount)}</span></div>` : ""}
    ${invoiceCustomer?.referredBy ? `<div class="totals-row"><span>Referral Discount</span><span style="color:#16a34a;">-${formatCurrency(newCustomerDiscount)}</span></div>` : ""}
    <div class="totals-row totals-divider grand-total"><span>Grand Total</span><span>${invoice ? formatCurrency(invoice.grandTotal) : ""}</span></div>
  </div>

  ${payments.length > 0 ? `
  <div class="payments-section">
    <div class="payments-title">Payment History</div>
    ${payments.map((p) => `
    <div class="payment-row">
      <div><span>${formatDateTime(p.paidAt)}</span> <span class="payment-method">${p.method}</span>${p.referenceNumber ? ` <span style="font-size:11px;color:#94a3b8;">Ref: ${p.referenceNumber}</span>` : ""}</div>
      <div style="font-weight:600">${formatCurrency(p.amount)}</div>
    </div>`).join("")}
    ${remainingBalance > 0 ? `<div class="balance-row"><span>Remaining Balance</span><span>${formatCurrency(remainingBalance)}</span></div>` : ""}
  </div>` : ""}

  ${(invoice?.termsAndConditions || jobCard?.termsAndConditions) ? `
  <div style="margin-top:28px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px;">Terms & Conditions</div>
    <div style="font-size:12px;color:#64748b;line-height:1.6;white-space:pre-wrap;">${invoice?.termsAndConditions || jobCard?.termsAndConditions}</div>
  </div>` : ""}

  ${(invoice?.notes || jobCard?.notes) ? `
  <div style="margin-top:20px;">
    <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;margin-bottom:8px;">Notes</div>
    <div style="font-size:12px;color:#64748b;line-height:1.6;white-space:pre-wrap;">${invoice?.notes || jobCard?.notes}</div>
  </div>` : ""}

  ${invoiceCustomer?.referralCode ? `
  <div style="margin-top:32px;padding:20px 24px;border:2px dashed #6366f1;border-radius:12px;text-align:center;background:#f5f3ff;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6366f1;margin-bottom:6px;">Your Referral Code</div>
    <div style="font-size:28px;font-weight:800;letter-spacing:2px;color:#1a1a2e;font-family:'SF Mono','Fira Code',monospace;">${invoiceCustomer.referralCode}</div>
    <div style="font-size:12px;color:#64748b;margin-top:8px;">Share this code with friends! They get <strong>${formatCurrency(newCustomerDiscount)} off</strong> their first service, and you earn <strong>${formatCurrency(referralRewardAmount)}</strong> in your wallet.</div>
  </div>` : ""}

  <div class="footer">
    <div class="footer-thanks">Thank you for choosing Prime Detailers!</div>
    <div class="footer-sub">For questions about this invoice, contact us at hello@primedetailers.in</div>
    <div class="footer-brand">Powered by Prime Detailers &bull; Service Management Platform</div>
  </div>
</div>
<script>window.onload=function(){window.print();}</script>
</body></html>`);
    printWindow.document.close();
  };

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Invoice not found</p>
        <Button variant="outline" onClick={() => router.push("/billing")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Button>
      </div>
    );
  }

  const vehicleMakeModel = jobCard?.vehicleMakeModel ?? "—";

  return (
    <div className="space-y-6 print:hidden">
      <Breadcrumbs items={[
        { label: "Billing", href: "/billing" },
        { label: invoice.invoiceNumber },
      ]} />
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Invoice sent via WhatsApp")}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Send via WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        {(invoice.status === "ISSUED" || invoice.status === "PARTIALLY_PAID") &&
          remainingBalance > 0 && (
            <Button size="sm" onClick={openRecordDialog}>Record Payment</Button>
          )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{invoice.invoiceNumber}</h1>
          <div className="flex items-center gap-3 mt-2">
            <InvoiceStatusBadge status={invoice.status} />
            <span className="text-muted-foreground text-sm">
              {formatDate(invoice.createdAt)}
            </span>
            <Link
              href={`/job-cards/${invoice.jobCardId}`}
              className="text-sm text-primary hover:underline"
            >
              {invoice.jobNumber}
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer & Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">{invoice.customerName}</span>
          </div>
          <div className="text-sm text-muted-foreground">{invoice.customerPhone}</div>
          <div className="text-sm">
            Vehicle: {invoice.vehicleRegNumber} · {vehicleMakeModel}
          </div>
          {invoice.mechanicName && (
            <div className="text-sm text-muted-foreground">
              Mechanic: {invoice.mechanicName}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground py-3 px-4">
                    Description
                  </th>
                  <th className="text-left font-medium text-muted-foreground py-3 px-4">
                    Type
                  </th>
                  <th className="text-right font-medium text-muted-foreground py-3 px-4">
                    Qty
                  </th>
                  <th className="text-right font-medium text-muted-foreground py-3 px-4">
                    Unit Price
                  </th>
                  <th className="text-right font-medium text-muted-foreground py-3 px-4">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border">
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary">{item.type}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">{item.quantity}</td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={4} className="py-3 px-4 text-right text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="py-3 px-4 text-right">{formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-2 px-4 text-right text-muted-foreground">
                    Tax ({Math.round(invoice.taxRate * 100)}%)
                  </td>
                  <td className="py-2 px-4 text-right">{formatCurrency(invoice.taxAmount)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-2 px-4 text-right text-muted-foreground">
                    Discount
                  </td>
                  <td className="py-2 px-4 text-right">{formatCurrency(invoice.discountAmount)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="py-2 px-4 text-right text-muted-foreground">
                    Reward Discount
                  </td>
                  <td className="py-2 px-4 text-right">{formatCurrency(invoice.rewardDiscount)}</td>
                </tr>
                {invoiceCustomer?.referredBy && (
                  <tr>
                    <td colSpan={4} className="py-2 px-4 text-right text-muted-foreground">
                      Referral Discount
                    </td>
                    <td className="py-2 px-4 text-right text-green-600 dark:text-green-400">
                      -{formatCurrency(newCustomerDiscount)}
                    </td>
                  </tr>
                )}
                {invoice.walletAmountUsed > 0 && (
                  <tr>
                    <td colSpan={4} className="py-2 px-4 text-right text-muted-foreground">
                      Wallet Used
                    </td>
                    <td className="py-2 px-4 text-right">{formatCurrency(invoice.walletAmountUsed)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-border">
                  <td colSpan={4} className="py-4 px-4 text-right font-bold text-lg">
                    Grand Total
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-lg">
                    {formatCurrency(invoice.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {(invoice.termsAndConditions || jobCard?.termsAndConditions) && (
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {invoice.termsAndConditions || jobCard?.termsAndConditions}
            </p>
          </CardContent>
        </Card>
      )}

      {(invoice.notes || jobCard?.notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {invoice.notes || jobCard?.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {invoiceCustomer?.referralCode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              Your Referral Code
            </p>
            <p className="text-3xl font-extrabold tracking-widest font-mono border-2 border-dashed border-primary/40 rounded-lg py-3 px-6 inline-block">
              {invoiceCustomer.referralCode}
            </p>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
              Share this code with friends! They get <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(newCustomerDiscount)} off</span> their first service, and you earn <span className="font-semibold text-primary">{formatCurrency(referralRewardAmount)}</span> in your wallet.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-sm text-muted-foreground">
                      {formatDateTime(payment.paidAt)}
                    </span>
                    <PaymentMethodBadge method={payment.method} />
                    {payment.referenceNumber && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {payment.referenceNumber}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
              {(invoice.status === "PARTIALLY_PAID" || invoice.status === "ISSUED") &&
                remainingBalance > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        Remaining Balance
                      </span>
                      <span className="font-bold">{formatCurrency(remainingBalance)}</span>
                    </div>
                  </>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Number (optional)</Label>
              <Input
                id="reference"
                placeholder="UPI ref, TXN ID, etc."
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={
                !paymentAmount ||
                isNaN(Number(paymentAmount)) ||
                Number(paymentAmount) <= 0
              }
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
