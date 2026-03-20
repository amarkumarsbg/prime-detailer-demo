"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/shared/kpi-card";
import { JobCardStatusBadge } from "@/components/shared/status-badge";
import { dashboardStats, serviceReminders } from "@/lib/mock-data";
import { useJobCardStore } from "@/store/job-card-store";
import { useInventoryStore } from "@/store/inventory-store";
import { getStockStatus } from "@/lib/inventory-units";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Car,
  CarFront,
  Wrench,
  IndianRupee,
  UserPlus,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  Receipt,
  Bell,
  TrendingDown,
  UserX,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const { jobCards } = useJobCardStore();
  const parts = useInventoryStore((s) => s.parts);
  const stats = dashboardStats;

  const alerts = useMemo(() => {
    const items: { id: string; icon: React.ElementType; label: string; count: number; href: string; color: string; bgColor: string }[] = [];

    const overdueJobs = jobCards.filter((jc) => {
      const expected = new Date(jc.expectedDelivery);
      return expected < new Date() && !["DELIVERED", "CANCELLED"].includes(jc.status);
    });
    if (overdueJobs.length > 0) {
      items.push({ id: "overdue", icon: AlertTriangle, label: "Overdue job cards", count: overdueJobs.length, href: "/job-cards", color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30" });
    }

    const lowStock = parts.filter((p) => getStockStatus(p).label === "Low Stock");
    if (lowStock.length > 0) {
      items.push({ id: "stock", icon: Package, label: "Low stock items", count: lowStock.length, href: "/inventory", color: "text-amber-700 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" });
    }

    if (stats.pendingPayments > 0) {
      items.push({ id: "payments", icon: Receipt, label: "Pending payments", count: stats.pendingPayments, href: "/billing", color: "text-orange-700 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-900/30" });
    }

    const overdueReminders = serviceReminders.filter((r) => r.status === "OVERDUE" || r.status === "DUE");
    if (overdueReminders.length > 0) {
      items.push({ id: "reminders", icon: Bell, label: "Due service reminders", count: overdueReminders.length, href: "/reminders", color: "text-violet-700 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-900/30" });
    }

    if (stats.inactiveCustomers > 0) {
      items.push({ id: "inactive", icon: UserX, label: "Inactive customers", count: stats.inactiveCustomers, href: "/follow-ups", color: "text-slate-700 dark:text-slate-400", bgColor: "bg-slate-100 dark:bg-slate-900/30" });
    }

    return items;
  }, [stats.pendingPayments, stats.inactiveCustomers, jobCards, parts]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of today&apos;s operations &middot; {formatDate(new Date())}
          </p>
        </div>
        <Link href="/job-cards/new">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Job Card
          </Button>
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert) => (
            <Link key={alert.id} href={alert.href}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border ${alert.bgColor} hover:shadow-sm transition-all`}>
                <alert.icon className={`w-4 h-4 ${alert.color}`} />
                <span className={`text-sm font-semibold ${alert.color}`}>{alert.count}</span>
                <span className="text-xs text-muted-foreground">{alert.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        <KPICard
          title="Cars Received"
          value={stats.carsReceivedToday}
          subtitle="today"
          icon={Car}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Cars Delivered"
          value={stats.carsDeliveredToday}
          subtitle="today"
          icon={CarFront}
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="In Progress"
          value={stats.inProgressServices}
          subtitle="services"
          icon={Wrench}
        />
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(stats.dailyRevenue)}
          subtitle="collected"
          icon={IndianRupee}
          trend={{ value: 15, isPositive: true }}
        />
        <KPICard
          title="New Customers"
          value={stats.newCustomersToday}
          subtitle="today"
          icon={UserPlus}
        />
        <KPICard
          title="Total Expenses Today"
          value={formatCurrency(stats.totalExpensesToday)}
          subtitle="today"
          icon={TrendingDown}
        />
        <KPICard
          title="Net Profit Today"
          value={formatCurrency(stats.netProfitToday)}
          subtitle="revenue - expenses"
          icon={IndianRupee}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Inactive Customers"
          value={stats.inactiveCustomers}
          subtitle="need follow-up"
          icon={UserX}
        />
        <KPICard
          title="Active Job Cards"
          value={stats.activeJobCards}
          subtitle="in progress"
          icon={ClipboardList}
        />
        <KPICard
          title="Pending Payments"
          value={stats.pendingPayments}
          subtitle="awaiting collection"
          icon={AlertCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Revenue, Expenses & Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    width={50}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value))]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.serviceBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 10 }}
                    stroke="#94a3b8"
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "13px",
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Today&apos;s Bookings</CardTitle>
            </div>
            <Link href="/job-cards">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.todaysBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No bookings today</p>
            ) : (
              stats.todaysBookings.map((jc) => (
                <Link
                  key={jc.id}
                  href={`/job-cards/${jc.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{jc.jobNumber}</span>
                      <JobCardStatusBadge status={jc.status} />
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{jc.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {jc.vehicleRegNumber} &middot; {jc.vehicleMakeModel}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">
                      {jc.mechanicName || "Unassigned"}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-base font-semibold">Ready for Delivery</CardTitle>
            </div>
            <Link href="/job-cards">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.readyForDelivery.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No vehicles ready for delivery
              </p>
            ) : (
              stats.readyForDelivery.map((jc) => (
                <Link
                  key={jc.id}
                  href={`/job-cards/${jc.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{jc.jobNumber}</span>
                      <JobCardStatusBadge status={jc.status} />
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{jc.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {jc.vehicleRegNumber} &middot; {jc.vehicleMakeModel}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs text-muted-foreground">{jc.customerPhone}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
