"use client";

import { useState, useMemo } from "react";
import { parts, stockMovements } from "@/lib/mock-data";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/utils";
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
import { Plus, Package, AlertTriangle, TrendingDown, TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { Part, PartCategory } from "@/types";
import { toast } from "sonner";

const allCategories: PartCategory[] = ["Engine", "Brakes", "Electrical", "Filters", "Suspension", "AC", "Body", "Lubricants", "Tires", "Other"];

function getStockStatus(part: Part) {
  if (part.quantity === 0) return { label: "Out of Stock", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  if (part.quantity <= part.reorderLevel) return { label: "Low Stock", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
  return { label: "In Stock", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
}

export default function InventoryPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);

  const totalParts = parts.length;
  const totalValue = parts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  const lowStockCount = parts.filter((p) => p.quantity <= p.reorderLevel && p.quantity > 0).length;
  const outOfStockCount = parts.filter((p) => p.quantity === 0).length;

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
          <div className="flex items-center gap-2">
            <span className="font-semibold">{item.quantity}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.className}`}>
              {status.label}
            </span>
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
      label: "Reorder At",
      className: "hidden md:table-cell",
      render: (item: Part) => <span className="text-muted-foreground">{item.reorderLevel}</span>,
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Inventory"
        description="Track spare parts and stock levels"
        actions={
          <div className="flex gap-2">
            <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Adjust Stock</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Stock Adjustment</DialogTitle>
                  <DialogDescription>Add or remove stock for a part.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); toast.success("Stock adjusted"); setAdjustDialogOpen(false); }} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label>Part</Label>
                    <Select required>
                      <SelectTrigger><SelectValue placeholder="Select part" /></SelectTrigger>
                      <SelectContent>
                        {parts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.quantity} in stock)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select required>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">Stock In</SelectItem>
                          <SelectItem value="OUT">Stock Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="1" placeholder="0" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Input placeholder="e.g. Restock, Used in job card..." required />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setAdjustDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Confirm</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Add Part</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Part</DialogTitle>
                  <DialogDescription>Add a new part to inventory.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); toast.success("Part added"); setAddDialogOpen(false); }} className="space-y-4 mt-2">
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
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {allCategories.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
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
                    <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Part</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

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
        </TabsList>
        <TabsContent value="parts" className="mt-4">
          <DataTable
            data={parts}
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
                  return (
                    <div key={m.id} className="flex items-center gap-4 p-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        m.type === "IN" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        {m.type === "IN" ? (
                          <ArrowDownCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {m.type === "IN" ? "+" : "-"}{m.quantity} &middot; {part?.name ?? m.partId}
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
      </Tabs>
    </div>
  );
}
