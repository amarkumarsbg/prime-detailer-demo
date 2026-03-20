"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { KPICard } from "@/components/shared/kpi-card";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useInvoiceStore } from "@/store/invoice-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import { IndianRupee, TrendingUp, FileText, Receipt } from "lucide-react";

const STATUS_TABS: { value: "all" | InvoiceStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED", label: "Issued" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
];

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
  };
  return labels[method] ?? method;
}

export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const invoices = useInvoiceStore((s) => s.invoices);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = { all: invoices.length };
    invoices.forEach((inv) => {
      c[inv.status] = (c[inv.status] ?? 0) + 1;
    });
    return c;
  }, [invoices]);

  const toTableRows = (list: Invoice[]) =>
    list.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      vehicleRegNumber: inv.vehicleRegNumber,
      grandTotal: inv.grandTotal,
      status: inv.status,
      paymentMethod: inv.payments[0]?.method ?? null,
      walletAmountUsed: inv.walletAmountUsed,
      createdAt: inv.createdAt,
    })) as Record<string, unknown>[];

  const allTableData = useMemo(() => toTableRows(invoices), [invoices]);

  const kpis = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === "PAID");
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const outstanding = invoices
      .filter((i) => i.status === "ISSUED" || i.status === "PARTIALLY_PAID")
      .reduce((sum, i) => {
        const paid = i.payments.reduce((p, pay) => p + pay.amount, 0);
        return sum + (i.grandTotal - paid);
      }, 0);
    const now = new Date();
    const thisMonth = invoices.filter((inv) => {
      const d = new Date(inv.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const avgValue =
      paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    return {
      totalRevenue,
      outstanding,
      thisMonth,
      avgValue,
    };
  }, [invoices]);

  const columns = [
    {
      key: "invoiceNumber",
      label: "Invoice Number",
      render: (item: Record<string, unknown>) => (
        <span className="font-mono font-bold">{item.invoiceNumber as string}</span>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      label: "Customer Name",
      render: (item: Record<string, unknown>) => (
        <span className="font-medium">{item.customerName as string}</span>
      ),
      sortable: true,
    },
    {
      key: "vehicleRegNumber",
      label: "Vehicle",
      render: (item: Record<string, unknown>) => (
        <span className="text-muted-foreground">{item.vehicleRegNumber as string}</span>
      ),
      sortable: true,
    },
    {
      key: "grandTotal",
      label: "Amount",
      render: (item: Record<string, unknown>) => (
        <div className="space-y-0.5">
          <span className="font-bold">{formatCurrency(item.grandTotal as number)}</span>
          {(item.walletAmountUsed as number) > 0 && (
            <p className="text-xs text-muted-foreground">
              Wallet: {formatCurrency(item.walletAmountUsed as number)}
            </p>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      render: (item: Record<string, unknown>) => (
        <InvoiceStatusBadge status={item.status as InvoiceStatus} />
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      render: (item: Record<string, unknown>) => {
        const method = item.paymentMethod as string | null;
        return method ? (
          <Badge variant="outline">{getPaymentMethodLabel(method)}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "createdAt",
      label: "Date",
      render: (item: Record<string, unknown>) => (
        <span className="text-muted-foreground">
          {formatDate(item.createdAt as string)}
        </span>
      ),
      sortable: true,
    },
  ];

  const handleRowClick = (item: Record<string, unknown>) => {
    router.push(`/billing/${item.id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Billing & Invoices"
        description="View and manage invoices, payments, and billing history"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          icon={IndianRupee}
        />
        <KPICard
          title="Outstanding"
          value={formatCurrency(kpis.outstanding)}
          icon={TrendingUp}
        />
        <KPICard
          title="Invoices This Month"
          value={kpis.thisMonth}
          icon={FileText}
        />
        <KPICard
          title="Average Invoice Value"
          value={formatCurrency(kpis.avgValue)}
          icon={Receipt}
        />
      </div>

      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="space-y-1 border-b border-border/80 bg-muted/20 pb-4">
          <CardTitle className="text-base font-semibold">Invoices</CardTitle>
          <p className="text-sm text-muted-foreground">
            Open an invoice to record payments, print, or share via WhatsApp.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1 w-full justify-start bg-muted/50 p-1">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:shadow-sm">
                  {tab.label}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({tabCounts[tab.value] ?? 0})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6 focus-visible:outline-none">
                <DataTable
                  data={
                    tab.value === "all"
                      ? allTableData
                      : toTableRows(invoices.filter((inv) => inv.status === tab.value))
                  }
                  columns={columns}
                  searchPlaceholder="Search by invoice number, customer, or vehicle..."
                  searchKeys={["invoiceNumber", "customerName", "vehicleRegNumber"]}
                  pageSize={10}
                  onRowClick={handleRowClick}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
