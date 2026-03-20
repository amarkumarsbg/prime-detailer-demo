"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { KPICard } from "@/components/shared/kpi-card";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { invoices } from "@/lib/mock-data";
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

  const filteredInvoices = useMemo(() => {
    if (activeTab === "all") return invoices;
    return invoices.filter((inv) => inv.status === activeTab);
  }, [activeTab]);

  const tableData = useMemo(
    () =>
      filteredInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        vehicleRegNumber: inv.vehicleRegNumber,
        grandTotal: inv.grandTotal,
        status: inv.status,
        paymentMethod: inv.payments[0]?.method ?? null,
        walletAmountUsed: inv.walletAmountUsed,
        createdAt: inv.createdAt,
      })) as Record<string, unknown>[],
    [filteredInvoices]
  );

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
  }, []);

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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            <DataTable
              data={tableData}
              columns={columns}
              searchPlaceholder="Search by invoice number, customer, or vehicle..."
              searchKeys={["invoiceNumber", "customerName", "vehicleRegNumber"]}
              pageSize={10}
              onRowClick={handleRowClick}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
