"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { JobCardStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useJobCardStore } from "@/store/job-card-store";
import { useDashboardFilterStore, DASHBOARD_FILTER } from "@/store/dashboard-filter-store";
import { isOverdueJobCard } from "@/lib/dashboard-filters";
import { FilterBanner } from "@/components/shared/filter-banner";
import { formatDate } from "@/lib/utils";
import type { JobCard, JobCardStatus } from "@/types";
import { Plus, LayoutGrid, List } from "lucide-react";

const TAB_STATUSES: (JobCardStatus | "ALL")[] = [
  "ALL",
  "RECEIVED",
  "INSPECTION",
  "AWAITING_SERVICE",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
  "CANCELLED",
];

const TAB_LABELS: Record<JobCardStatus | "ALL", string> = {
  ALL: "All",
  RECEIVED: "Received",
  INSPECTION: "Inspection",
  AWAITING_SERVICE: "Awaiting Service",
  QUALITY_CHECK: "Quality Check",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const KANBAN_COLUMNS: JobCardStatus[] = [
  "RECEIVED",
  "INSPECTION",
  "AWAITING_SERVICE",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
];

const KANBAN_COLORS: Record<JobCardStatus, string> = {
  RECEIVED: "border-t-blue-500",
  INSPECTION: "border-t-violet-500",
  AWAITING_SERVICE: "border-t-amber-500",
  QUALITY_CHECK: "border-t-cyan-500",
  READY: "border-t-emerald-500",
  DELIVERED: "border-t-green-500",
  CANCELLED: "border-t-red-500",
};

export default function JobCardsPage() {
  const router = useRouter();
  const { jobCards } = useJobCardStore();
  const activeFilter = useDashboardFilterStore((s) => s.activeFilter);
  const setActiveFilter = useDashboardFilterStore((s) => s.setActiveFilter);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  const jobCardsForView = useMemo(() => {
    if (activeFilter !== DASHBOARD_FILTER.OVERDUE) return jobCards;
    return jobCards.filter(isOverdueJobCard);
  }, [jobCards, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: jobCardsForView.length };
    jobCardsForView.forEach((jc) => {
      c[jc.status] = (c[jc.status] ?? 0) + 1;
    });
    return c;
  }, [jobCardsForView]);

  const kanbanData = useMemo(() => {
    const map: Record<string, JobCard[]> = {};
    KANBAN_COLUMNS.forEach((s) => { map[s] = []; });
    jobCardsForView.forEach((jc) => {
      if (jc.status !== "CANCELLED" && map[jc.status]) map[jc.status].push(jc);
    });
    return map;
  }, [jobCardsForView]);

  const columns = [
    {
      key: "jobNumber",
      label: "Job Number",
      render: (item: JobCard) => (
        <span className="font-mono font-medium">{item.jobNumber}</span>
      ),
      className: "font-mono",
    },
    {
      key: "customer",
      label: "Customer",
      render: (item: JobCard) => (
        <div>
          <div className="font-medium">{item.customerName}</div>
          <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
        </div>
      ),
    },
    {
      key: "vehicle",
      label: "Vehicle",
      render: (item: JobCard) => (
        <div>
          <div className="font-medium">{item.vehicleRegNumber}</div>
          <div className="text-xs text-muted-foreground">
            {item.vehicleMakeModel}
          </div>
        </div>
      ),
    },
    {
      key: "mechanic",
      label: "Mechanic",
      render: (item: JobCard) => (
        <span className="text-muted-foreground">
          {item.mechanicName ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: JobCard) => <JobCardStatusBadge status={item.status} />,
    },
    {
      key: "expectedDelivery",
      label: "Expected Delivery",
      render: (item: JobCard) => formatDate(item.expectedDelivery),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (item: JobCard) => formatDate(item.createdAt),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Job Cards"
        description="Track workshop jobs from intake to delivery. Switch to board view to see work by stage."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center justify-center w-9 h-9 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center justify-center w-9 h-9 transition-colors ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <Link href="/job-cards/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Job Card
              </Button>
            </Link>
          </div>
        }
      />

      {activeFilter === DASHBOARD_FILTER.OVERDUE && (
        <FilterBanner
          message="⚠ Showing overdue job cards — delivery date has passed"
          onDismiss={() => setActiveFilter(null)}
        />
      )}

      {viewMode === "list" ? (
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="space-y-1 border-b border-border/80 bg-muted/20 pb-4">
            <CardTitle className="text-base font-semibold">All job cards</CardTitle>
            <p className="text-sm text-muted-foreground">
              Open a row for full detail, photos, and status updates.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex-wrap h-auto gap-1 w-full justify-start bg-muted/50 p-1 mb-0">
                {TAB_STATUSES.map((status) => (
                  <TabsTrigger key={status} value={status} className="data-[state=active]:shadow-sm">
                    {TAB_LABELS[status]} ({counts[status] ?? 0})
                  </TabsTrigger>
                ))}
              </TabsList>

              {TAB_STATUSES.map((status) => (
                <TabsContent key={status} value={status} className="mt-6 focus-visible:outline-none">
                  <DataTable<JobCard>
                    data={
                      status === "ALL"
                        ? jobCardsForView
                        : jobCardsForView.filter((jc) => jc.status === status)
                    }
                    columns={columns}
                    searchPlaceholder="Search by job number, customer, mobile, or vehicle..."
                    searchKeys={["jobNumber", "customerName", "customerPhone", "vehicleRegNumber"]}
                    pageSize={10}
                    onRowClick={(item) => router.push(`/job-cards/${item.id}`)}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {KANBAN_COLUMNS.map((status) => (
            <div key={status} className="shrink-0 w-[260px] sm:w-[280px]">
              <div className={`rounded-xl border border-border/80 bg-card shadow-sm border-t-4 ${KANBAN_COLORS[status]}`}>
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/80 bg-muted/20">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    {TAB_LABELS[status]}
                  </h3>
                  <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-background border border-border text-xs font-semibold tabular-nums">
                    {kanbanData[status]?.length ?? 0}
                  </span>
                </div>
                <div className="p-2 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
                  {(kanbanData[status] ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1 py-10 text-xs text-muted-foreground">
                      <span>No jobs in this stage</span>
                    </div>
                  ) : (
                    (kanbanData[status] ?? []).map((jc) => (
                      <div
                        key={jc.id}
                        onClick={() => router.push(`/job-cards/${jc.id}`)}
                        className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-semibold text-primary">{jc.jobNumber}</span>
                        </div>
                        <p className="text-sm font-medium leading-tight">{jc.customerName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{jc.vehicleRegNumber} &middot; {jc.vehicleMakeModel}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                          <span className="text-[10px] text-muted-foreground">
                            {jc.mechanicName ?? "Unassigned"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(jc.expectedDelivery)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
