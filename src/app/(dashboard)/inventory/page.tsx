"use client";

import { useState, useMemo } from "react";
import { serviceCatalog } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import {
  formatMlAndLitres,
  getStockStatus,
  isMlTrackedPart,
  partStockValueInr,
} from "@/lib/inventory-units";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import type { Part, PartCategory } from "@/types";
import { toast } from "sonner";
import { useInventoryStore, parseLitresInput } from "@/store/inventory-store";
import { carsPossibleForPartAndService } from "@/lib/inventory/consumption";
import { useDashboardFilterStore, DASHBOARD_FILTER } from "@/store/dashboard-filter-store";
import { isLowStockPart } from "@/lib/dashboard-filters";
import { FilterBanner } from "@/components/shared/filter-banner";

const allCategories: PartCategory[] = [
  "Engine",
  "Brakes",
  "Electrical",
  "Filters",
  "Suspension",
  "AC",
  "Body",
  "Lubricants",
  "Tires",
  "Detailing",
  "Other",
];

const normalWashService = serviceCatalog.find((s) => s.id === "svc-016");
const advancedWashService = serviceCatalog.find((s) => s.id === "svc-017");
const premiumWashService = serviceCatalog.find((s) => s.id === "svc-021");

type StockTableFilter = "all" | "low" | "out";

export default function InventoryPage() {
  const activeFilter = useDashboardFilterStore((s) => s.activeFilter);
  const setActiveFilter = useDashboardFilterStore((s) => s.setActiveFilter);
  const parts = useInventoryStore((s) => s.parts);

  const [stockTableFilter, setStockTableFilter] = useState<StockTableFilter>("all");

  const partsForTable = useMemo(() => {
    let list = parts;
    if (activeFilter === DASHBOARD_FILTER.LOW_STOCK) {
      list = list.filter(isLowStockPart);
    }
    if (stockTableFilter === "low") {
      list = list.filter((p) => getStockStatus(p).label === "Low Stock");
    } else if (stockTableFilter === "out") {
      list = list.filter((p) => getStockStatus(p).label === "Out of Stock");
    }
    return list;
  }, [parts, activeFilter, stockTableFilter]);
  const stockMovements = useInventoryStore((s) => s.stockMovements);
  const productPurchases = useInventoryStore((s) => s.productPurchases);
  const addPurchase = useInventoryStore((s) => s.addPurchase);
  const recordStockAdjustment = useInventoryStore((s) => s.recordStockAdjustment);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  const [purchasePartId, setPurchasePartId] = useState("");
  const [purchaseVendor, setPurchaseVendor] = useState("");
  const [purchaseLitres, setPurchaseLitres] = useState("");
  const [purchaseRef, setPurchaseRef] = useState("");

  const [adjustPartId, setAdjustPartId] = useState("");
  const [adjustDirection, setAdjustDirection] = useState<"IN" | "OUT">("IN");
  const [adjustAmount, setAdjustAmount] = useState("");

  const totalParts = parts.length;
  const totalValue = parts.reduce((sum, p) => sum + partStockValueInr(p), 0);
  const lowStockCount = parts.filter((p) => {
    const s = getStockStatus(p);
    return s.label === "Low Stock";
  }).length;
  const outOfStockCount = parts.filter((p) => {
    const s = getStockStatus(p);
    return s.label === "Out of Stock";
  }).length;

  const partsById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts]);

  const columns = [
    {
      key: "name",
      label: "Part",
      render: (item: Part) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground">{item.sku}</p>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (item: Part) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {item.category}
        </span>
      ),
    },
    {
      key: "quantity",
      label: "Stock",
      sortable: true,
      render: (item: Part) => {
        const status = getStockStatus(item);
        return (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="font-semibold text-sm">
              {isMlTrackedPart(item)
                ? formatMlAndLitres(item.stockQuantityMl ?? 0)
                : `${item.quantity} ${item.primaryUnit}`}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        );
      },
    },
    {
      key: "efficiency",
      label: "Est. cars (wash)",
      className: "hidden xl:table-cell",
      render: (item: Part) => {
        if (!normalWashService || !isMlTrackedPart(item) || item.id !== "prt-021") {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        const n = carsPossibleForPartAndService(item, normalWashService);
        const a = advancedWashService
          ? carsPossibleForPartAndService(item, advancedWashService)
          : 0;
        const p = premiumWashService
          ? carsPossibleForPartAndService(item, premiumWashService)
          : 0;
        return (
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{n}</span> normal
            {" · "}
            <span className="text-foreground font-medium">{a}</span> advanced
            {" · "}
            <span className="text-foreground font-medium">{p}</span> premium
          </div>
        );
      },
    },
    {
      key: "unitPrice",
      label: "Unit Price",
      sortable: true,
      render: (item: Part) => <span>{formatCurrency(item.unitPrice)}</span>,
    },
    {
      key: "reorderLevel",
      label: "Reorder at",
      className: "hidden md:table-cell",
      render: (item: Part) => (
        <span className="text-muted-foreground text-sm">
          {isMlTrackedPart(item)
            ? formatMlAndLitres(item.reorderLevelMl ?? 0)
            : item.reorderLevel}
        </span>
      ),
    },
    {
      key: "supplier",
      label: "Supplier",
      className: "hidden lg:table-cell",
    },
  ];

  const recentMovements = [...stockMovements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const mlPartsForPurchase = parts.filter((p) => isMlTrackedPart(p));

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ml = parseLitresInput(purchaseLitres);
    if (!purchasePartId || !purchaseVendor.trim() || ml == null || ml <= 0) {
      toast.error("Enter a valid part, vendor, and quantity (litres).");
      return;
    }
    addPurchase({
      partId: purchasePartId,
      vendorName: purchaseVendor.trim(),
      quantityMl: ml,
      reference: purchaseRef.trim() || undefined,
      purchasedAt: new Date().toISOString(),
      recordedBy: "usr-001",
    });
    toast.success("Purchase recorded and stock updated.");
    setPurchaseDialogOpen(false);
    setPurchasePartId("");
    setPurchaseVendor("");
    setPurchaseLitres("");
    setPurchaseRef("");
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parts.find((x) => x.id === adjustPartId);
    if (!p) return;
    const n = Number(adjustAmount);
    if (!adjustPartId || Number.isNaN(n) || n <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (isMlTrackedPart(p)) {
      recordStockAdjustment({
        partId: adjustPartId,
        direction: adjustDirection,
        amountMl: n,
        reason: "Manual adjustment",
        performedBy: "usr-001",
      });
    } else {
      recordStockAdjustment({
        partId: adjustPartId,
        direction: adjustDirection,
        amountCount: Math.round(n),
        reason: "Manual adjustment",
        performedBy: "usr-001",
      });
    }
    toast.success("Stock adjusted.");
    setAdjustDialogOpen(false);
    setAdjustAmount("");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inventory"
        description="Track spare parts and stock levels (fluids in ml; shown in litres)"
        actions={
          <div className="flex flex-wrap gap-2">
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Adjust Stock</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Stock Adjustment</DialogTitle>
                  <DialogDescription>
                    For fluids, enter amount in millilitres. For pieces, enter units.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdjustSubmit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Part</Label>
                    <Select value={adjustPartId} onValueChange={setAdjustPartId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select part" />
                      </SelectTrigger>
                      <SelectContent>
                        {parts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={adjustDirection}
                        onValueChange={(v) => setAdjustDirection(v as "IN" | "OUT")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">Stock In</SelectItem>
                          <SelectItem value="OUT">Stock Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        min="0.001"
                        step="any"
                        placeholder={adjustPartId && partsById.get(adjustPartId) && isMlTrackedPart(partsById.get(adjustPartId)!) ? "ml" : "units"}
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Confirm</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Record purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record product purchase</DialogTitle>
                  <DialogDescription>
                    Log vendor, date (now), and quantity in litres. Stock increases in ml internally.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePurchaseSubmit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Fluid part</Label>
                    <Select value={purchasePartId} onValueChange={setPurchasePartId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select part" />
                      </SelectTrigger>
                      <SelectContent>
                        {mlPartsForPurchase.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Input
                      value={purchaseVendor}
                      onChange={(e) => setPurchaseVendor(e.target.value)}
                      placeholder="Supplier name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity (litres)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={purchaseLitres}
                      onChange={(e) => setPurchaseLitres(e.target.value)}
                      placeholder="e.g. 24"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference (optional)</Label>
                    <Input
                      value={purchaseRef}
                      onChange={(e) => setPurchaseRef(e.target.value)}
                      placeholder="PO number"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Part
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Part</DialogTitle>
                  <DialogDescription>Add a new part to inventory.</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    toast.success("Part added");
                    setAddDialogOpen(false);
                  }}
                  className="space-y-4 mt-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Part Name</Label>
                      <Input placeholder="e.g. Brake Pad Set" required />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input placeholder="e.g. BRK-PAD-001" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Initial Quantity</Label>
                      <Input type="number" min="0" placeholder="0" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price (₹)</Label>
                      <Input type="number" min="0" placeholder="0" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Reorder Level</Label>
                      <Input type="number" min="0" placeholder="0" required />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Supplier</Label>
                      <Input placeholder="e.g. Bosch India" required />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Part</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {activeFilter === DASHBOARD_FILTER.LOW_STOCK && (
        <FilterBanner
          message="⚠ Showing low stock items — below reorder threshold"
          onDismiss={() => setActiveFilter(null)}
        />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalParts}</p>
              <p className="text-sm text-muted-foreground">Total Parts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <p className="text-sm text-muted-foreground">Stock Value</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStockCount}</p>
              <p className="text-sm text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="parts">
        <TabsList>
          <TabsTrigger value="parts">Parts List</TabsTrigger>
          <TabsTrigger value="movements">Recent Movements</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>
        <TabsContent value="parts" className="mt-4 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Label htmlFor="inventory-stock-filter" className="text-muted-foreground shrink-0">
              Stock status
            </Label>
            <Select
              value={stockTableFilter}
              onValueChange={(v) => setStockTableFilter(v as StockTableFilter)}
            >
              <SelectTrigger id="inventory-stock-filter" className="w-full sm:w-[220px]">
                <SelectValue placeholder="All parts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All parts</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataTable
            data={partsForTable}
            columns={columns}
            searchPlaceholder="Search parts..."
            searchKeys={["name", "sku", "category", "supplier"]}
          />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardContent className="p-0!">
              <div className="divide-y divide-border">
                {recentMovements.map((m) => {
                  const part = parts.find((p) => p.id === m.partId);
                  const qtyLabel =
                    m.unit === "ML" ? `${m.quantity.toLocaleString("en-IN")} ml` : `${m.quantity} ${m.unit}`;
                  return (
                    <div key={m.id} className="flex items-center gap-4 p-4">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          m.type === "IN"
                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        {m.type === "IN" ? (
                          <ArrowDownCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {m.type === "IN" ? "+" : "-"}
                          {qtyLabel} · {part?.name ?? m.partId}
                        </p>
                        <p className="text-xs text-muted-foreground">{m.reason}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchases" className="mt-4">
          <Card>
            <CardContent className="p-0!">
              <div className="divide-y divide-border">
                {productPurchases.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No purchases recorded.</p>
                ) : (
                  [...productPurchases]
                    .sort(
                      (a, b) =>
                        new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
                    )
                    .map((pp) => {
                      const part = parts.find((p) => p.id === pp.partId);
                      return (
                        <div key={pp.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-sm">{part?.name ?? pp.partId}</p>
                            <p className="text-xs text-muted-foreground">
                              {pp.vendorName}
                              {pp.reference ? ` · ${pp.reference}` : ""}
                            </p>
                          </div>
                          <div className="text-sm text-right">
                            <p className="font-medium">{formatMlAndLitres(pp.quantityMl)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(pp.purchasedAt)}</p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
