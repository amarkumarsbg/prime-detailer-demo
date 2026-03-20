"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { dashboardStats, jobCards } from "@/lib/mock-data";
import { useInventoryStore } from "@/store/inventory-store";
import { useInvoiceStore } from "@/store/invoice-store";
import { useStaffStore } from "@/store/staff-store";
import { useExpenseStore } from "@/store/expense-store";
import {
  getStockStatus,
  isMlTrackedPart,
  mlToLitres,
} from "@/lib/inventory-units";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wrench,
  Package,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const CHART_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [revenueGranularity, setRevenueGranularity] = useState<"day" | "week" | "month">("month");
  const parts = useInventoryStore((s) => s.parts);
  const invoices = useInvoiceStore((s) => s.invoices);
  const staff = useStaffStore((s) => s.staff);
  const expenses = useExpenseStore((s) => s.expenses);

  // Revenue Report - Line chart by day/week/month
  const revenueData = useMemo(() => {
    const periodMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const date = new Date(inv.createdAt);
      let key: string;
      if (revenueGranularity === "day") {
        key = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } else if (revenueGranularity === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `W${Math.ceil(weekStart.getDate() / 7)} ${weekStart.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`;
      } else {
        key = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      }
      periodMap[key] = (periodMap[key] || 0) + paid;
    });
    return Object.entries(periodMap)
      .map(([period, collected]) => ({ period, collected }))
      .sort((a, b) => {
        const idxA = Object.keys(periodMap).indexOf(a.period);
        const idxB = Object.keys(periodMap).indexOf(b.period);
        return idxA - idxB;
      });
  }, [revenueGranularity, invoices]);

  const totalCollected = invoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((s, p) => s + p.amount, 0),
    0
  );
  const totalPending = invoices.reduce(
    (sum, inv) => sum + inv.grandTotal - inv.payments.reduce((s, p) => s + p.amount, 0),
    0
  );

  // Expense Report
  const expenseByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    expenses.forEach((exp) => {
      categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, exp) => sum + exp.amount, 0),
    [expenses]
  );

  // Profit Report
  const profitData = useMemo(
    () =>
      dashboardStats.monthlyRevenue.map((m) => ({
        month: m.month,
        revenue: m.revenue,
        expenses: m.expenses,
        profit: m.profit,
      })),
    []
  );

  const dayWiseProfitData = useMemo(() => {
    const dayMap: Record<string, { revenue: number; expenses: number; profit: number }> = {};
    invoices.forEach((inv) => {
      const date = new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
      if (!dayMap[date]) dayMap[date] = { revenue: 0, expenses: 0, profit: 0 };
      dayMap[date].revenue += paid;
    });
    expenses.forEach((exp) => {
      const date = new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!dayMap[date]) dayMap[date] = { revenue: 0, expenses: 0, profit: 0 };
      dayMap[date].expenses += exp.amount;
    });
    return Object.entries(dayMap).map(([day, data]) => ({ day, ...data, profit: data.revenue - data.expenses }));
  }, [invoices, expenses]);

  // TNM Report
  const mechanicPerformance = useMemo(() => {
    const mechanics = staff.filter((s) => s.role === "MECHANIC");
    return mechanics.map((m) => {
      const jobs = jobCards.filter((jc) => jc.mechanicId === m.id);
      const completed = jobs.filter((jc) => jc.status === "DELIVERED").length;
      const totalRevenue = jobs.filter((jc) => jc.status === "DELIVERED").reduce((sum, jc) => sum + jc.estimatedAmount, 0);
      const totalIncentive = jobs.filter((jc) => jc.status === "DELIVERED").reduce((sum, jc) => sum + (jc.incentiveAmount || 0), 0);
      const completedWithDelivery = jobs.filter((jc) => jc.status === "DELIVERED" && jc.actualDelivery);
      const totalTimeMs = completedWithDelivery.reduce((sum, jc) => {
        const created = new Date(jc.createdAt).getTime();
        const delivered = new Date(jc.actualDelivery!).getTime();
        return sum + (delivered - created);
      }, 0);
      const avgJobTimeHours = completedWithDelivery.length > 0 ? totalTimeMs / (completedWithDelivery.length * (1000 * 60 * 60)) : 0;
      return {
        name: m.name.split(" ")[0],
        fullName: m.name,
        jobsCompleted: completed,
        totalRevenue,
        avgJobTimeHours: Math.round(avgJobTimeHours * 10) / 10,
        incentiveEarned: totalIncentive,
      };
    });
  }, [staff, jobCards]);

  // Inventory Report (fluid stock chart uses litre-equivalent)
  const stockLevelsData = useMemo(
    () =>
      parts.map((p) => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
        quantity: isMlTrackedPart(p) ? mlToLitres(p.stockQuantityMl ?? 0) : p.quantity,
        reorderLevel: isMlTrackedPart(p) ? mlToLitres(p.reorderLevelMl ?? 0) : p.reorderLevel,
        status: getStockStatus(p).label === "Low Stock" ? "low" : "ok",
      })),
    [parts]
  );
  const lowStockParts = useMemo(
    () => parts.filter((p) => getStockStatus(p).label === "Low Stock"),
    [parts]
  );
  const consumptionByCategory = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    parts.forEach((p) => {
      const v = isMlTrackedPart(p) ? mlToLitres(p.stockQuantityMl ?? 0) : p.quantity;
      categoryMap[p.category] = (categoryMap[p.category] || 0) + v;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [parts]);

  const exportCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}.csv downloaded`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Insights across revenue, expenses, profit, and performance"
        actions={
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Tabs defaultValue="revenue">
        <TabsList className="flex-wrap">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="expense">Expense</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="tnm">TNM Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5! flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalCollected)}</p>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5! flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={revenueGranularity} onValueChange={(v) => setRevenueGranularity(v as "day" | "week" | "month")}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">By Day</SelectItem>
                    <SelectItem value="week">By Week</SelectItem>
                    <SelectItem value="month">By Month</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => exportCSV(revenueData, "revenue-report")}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" className="text-xs" tick={{ fill: "currentColor" }} />
                    <YAxis width={60} className="text-xs" tick={{ fill: "currentColor" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }}
                      formatter={(value) => [formatCurrency(Number(value)), "Collected"]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="collected" name="Revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Expenses are added from the Expenses page; totals update here automatically.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/expenses">Add expense</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Expense by Category</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(expenseByCategory, "expense-by-category")}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {expenseByCategory.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }} formatter={(value) => [formatCurrency(Number(value)), ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Expense List</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(expenses.map((e) => ({ date: e.date, category: e.category, description: e.description, amount: e.amount })), "expense-list")}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="max-h-[320px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Date</th>
                        <th className="text-left py-2 font-medium">Category</th>
                        <th className="text-left py-2 font-medium">Description</th>
                        <th className="text-right py-2 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((exp) => (
                        <tr key={exp.id} className="border-b last:border-0">
                          <td className="py-2">{exp.date}</td>
                          <td className="py-2">{exp.category}</td>
                          <td className="py-2 max-w-[150px] truncate">{exp.description}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(profitData.reduce((s, m) => s + m.revenue, 0) / profitData.length)}</p>
                  <p className="text-sm text-muted-foreground">Avg Monthly Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(profitData.reduce((s, m) => s + m.expenses, 0) / profitData.length)}</p>
                  <p className="text-sm text-muted-foreground">Avg Monthly Expenses</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(profitData.reduce((s, m) => s + m.profit, 0) / profitData.length)}</p>
                  <p className="text-sm text-muted-foreground">Avg Monthly Profit</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Revenue vs Expenses vs Net Profit</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCSV(profitData, "profit-report")}>
                <Download className="w-4 h-4 mr-2" />Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: "currentColor" }} />
                    <YAxis width={60} className="text-xs" tick={{ fill: "currentColor" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }} formatter={(value) => [formatCurrency(Number(value)), ""]} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {dayWiseProfitData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Day-wise Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayWiseProfitData.slice(0, 14)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" className="text-xs" tick={{ fill: "currentColor" }} />
                      <YAxis width={60} className="text-xs" tick={{ fill: "currentColor" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }} formatter={(value) => [formatCurrency(Number(value)), ""]} />
                      <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tnm" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Mechanic Performance (Track & Monitor)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportCSV(mechanicPerformance.map((m) => ({ name: m.fullName, jobsCompleted: m.jobsCompleted, totalRevenue: m.totalRevenue, avgJobTimeHours: m.avgJobTimeHours, incentiveEarned: m.incentiveEarned })), "tnm-mechanic-report")}>
                <Download className="w-4 h-4 mr-2" />Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] sm:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mechanicPerformance} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" tick={{ fill: "currentColor" }} />
                    <YAxis dataKey="name" type="category" width={80} className="text-xs" tick={{ fill: "currentColor" }} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }} formatter={(value) => [formatCurrency(Number(value)), ""]} />
                    <Legend />
                    <Bar dataKey="totalRevenue" name="Revenue Generated" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="incentiveEarned" name="Incentive Earned" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {mechanicPerformance.map((m) => (
              <Card key={m.fullName}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                    <Wrench className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-center">{m.fullName}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Jobs: </span><span className="font-medium">{m.jobsCompleted}</span></p>
                    <p><span className="text-muted-foreground">Revenue: </span><span className="font-medium">{formatCurrency(m.totalRevenue)}</span></p>
                    <p><span className="text-muted-foreground">Avg Time: </span><span className="font-medium">{m.avgJobTimeHours}h</span></p>
                    <p><span className="text-muted-foreground">Incentive: </span><span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(m.incentiveEarned)}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          {lowStockParts.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Alerts ({lowStockParts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowStockParts.map((p) => (
                    <div key={p.id} className="px-3 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-sm">
                      {p.name}: {p.quantity} / {p.reorderLevel} {p.primaryUnit}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Stock Levels by Part</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(parts.map((p) => ({ name: p.name, sku: p.sku, category: p.category, quantity: isMlTrackedPart(p) ? mlToLitres(p.stockQuantityMl ?? 0) : p.quantity, reorderLevel: isMlTrackedPart(p) ? mlToLitres(p.reorderLevelMl ?? 0) : p.reorderLevel, status: getStockStatus(p).label === "Low Stock" ? "Low" : "OK" })), "inventory-stock-levels")}>
                  <Download className="w-4 h-4 mr-2" />Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockLevelsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={{ fill: "currentColor" }} angle={-45} textAnchor="end" height={80} />
                      <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }} />
                      <Bar dataKey="quantity" name="Quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="reorderLevel" name="Reorder Level" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Consumption by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={consumptionByCategory} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {consumptionByCategory.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--popover-foreground)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
