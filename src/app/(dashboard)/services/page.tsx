"use client";

import { useState, useMemo } from "react";
import type { ServiceCatalogItem, SegmentPricing } from "@/types";
import { useServiceCatalogStore } from "@/store/service-catalog-store";
import { AddAddonDialog } from "@/components/services/add-addon-dialog";
import { AddServicePackageDialog } from "@/components/services/add-service-package-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Search,
  Wrench,
  Tag,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Percent,
  Package,
  LayoutGrid,
  Table2,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const SEGMENT_LABELS: Record<keyof SegmentPricing, string> = {
  HATCHBACK: "Hatchback",
  SEDAN: "Sedan",
  SUV: "SUV",
  LUXURY: "Luxury",
  MUV: "MUV",
  COMPACT_SUV: "Compact SUV",
  BIKE: "Bike",
};

const SEGMENT_KEYS = Object.keys(SEGMENT_LABELS) as (keyof SegmentPricing)[];

type EditFormState = {
  name: string;
  description: string;
  category: string;
  defaultPrice: string;
  segmentPricing: Record<keyof SegmentPricing, string>;
  isHighEnd: boolean;
  isActive: boolean;
  incentivePercent: string;
};

function serviceToForm(s: ServiceCatalogItem): EditFormState {
  return {
    name: s.name,
    description: s.description,
    category: s.category,
    defaultPrice: String(s.defaultPrice),
    segmentPricing: SEGMENT_KEYS.reduce(
      (acc, k) => ({ ...acc, [k]: String(s.segmentPricing[k]) }),
      {} as Record<keyof SegmentPricing, string>
    ),
    isHighEnd: s.isHighEnd,
    isActive: s.isActive,
    incentivePercent: String(s.incentivePercent),
  };
}

function formToService(base: ServiceCatalogItem, form: EditFormState): ServiceCatalogItem {
  const segmentPricing = SEGMENT_KEYS.reduce(
    (acc, k) => ({
      ...acc,
      [k]: Math.max(0, parseFloat(form.segmentPricing[k]) || 0),
    }),
    {} as SegmentPricing
  );
  return {
    ...base,
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    defaultPrice: Math.max(0, parseFloat(form.defaultPrice) || 0),
    segmentPricing,
    isHighEnd: form.isHighEnd,
    isActive: form.isActive,
    incentivePercent: Math.min(100, Math.max(0, parseFloat(form.incentivePercent) || 0)),
  };
}

export default function ServicesPage() {
  const catalog = useServiceCatalogStore((s) => s.catalog);
  const setCatalog = useServiceCatalogStore((s) => s.setCatalog);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceCatalogItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCatalogItem | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extraCategories, setExtraCategories] = useState<string[]>([]);

  const categories = useMemo(
    () =>
      Array.from(new Set([...catalog.map((s) => s.category), ...extraCategories])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [catalog, extraCategories]
  );

  const filtered = useMemo(() => {
    let result = catalog;
    if (categoryFilter !== "all") {
      result = result.filter((s) => s.category === categoryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [catalog, search, categoryFilter]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editForm) return;
    if (!editForm.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    const updated = formToService(editTarget, editForm);
    setCatalog((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditOpen(false);
    setEditTarget(null);
    setEditForm(null);
    toast.success("Service updated");
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setCatalog((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setExpandedId((id) => (id === deleteTarget.id ? null : id));
    toast.success(`“${deleteTarget.name}” removed from catalog`);
    setDeleteTarget(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Service Catalog"
          description="Manage your service offerings and pricing"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={() => setAddonDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Add-on
              </Button>
              <AddAddonDialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen} />
              <AddServicePackageDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                extraCategories={extraCategories}
                setExtraCategories={setExtraCategories}
                trigger={
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service Package
                  </Button>
                }
              />
            </>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="cards" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Card View
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-2">
              <Table2 className="w-4 h-4" />
              Pricing Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isExpanded={expandedId === service.id}
                  onToggleExpand={() =>
                    setExpandedId((id) =>
                      id === service.id ? null : service.id
                    )
                  }
                  onEdit={() => {
                    setEditTarget(service);
                    setEditForm(serviceToForm(service));
                    setEditOpen(true);
                  }}
                  onDelete={() => setDeleteTarget(service)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="mt-0">
            <PricingMatrixTable services={filtered} />
          </TabsContent>
        </Tabs>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No services found matching your criteria.
          </div>
        )}

        <Dialog
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) {
              setEditTarget(null);
              setEditForm(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update details for {editTarget?.name ?? "this service"}.
              </DialogDescription>
            </DialogHeader>
            {editForm && editTarget && (
              <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-name">Service Name</Label>
                  <Input
                    id="edit-svc-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-svc-desc">Description</Label>
                  <Input
                    id="edit-svc-desc"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((f) => (f ? { ...f, description: e.target.value } : f))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-svc-category">Category</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(v) =>
                        setEditForm((f) => (f ? { ...f, category: v } : f))
                      }
                    >
                      <SelectTrigger id="edit-svc-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-svc-price">Base Price (₹)</Label>
                    <Input
                      id="edit-svc-price"
                      type="number"
                      min={0}
                      value={editForm.defaultPrice}
                      onChange={(e) =>
                        setEditForm((f) => (f ? { ...f, defaultPrice: e.target.value } : f))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Segment Pricing (₹)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
                    {SEGMENT_KEYS.map((seg) => (
                      <div key={seg} className="space-y-1">
                        <Label
                          htmlFor={`edit-seg-${seg}`}
                          className="text-xs text-muted-foreground"
                        >
                          {SEGMENT_LABELS[seg]}
                        </Label>
                        <Input
                          id={`edit-seg-${seg}`}
                          type="number"
                          min={0}
                          value={editForm.segmentPricing[seg]}
                          onChange={(e) =>
                            setEditForm((f) =>
                              f
                                ? {
                                    ...f,
                                    segmentPricing: {
                                      ...f.segmentPricing,
                                      [seg]: e.target.value,
                                    },
                                  }
                                : f
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-svc-high-end"
                      checked={editForm.isHighEnd}
                      onCheckedChange={(c) =>
                        setEditForm((f) => (f ? { ...f, isHighEnd: c === true } : f))
                      }
                    />
                    <Label htmlFor="edit-svc-high-end" className="text-sm font-medium cursor-pointer">
                      High-end service
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-svc-active"
                      checked={editForm.isActive}
                      onCheckedChange={(c) =>
                        setEditForm((f) => (f ? { ...f, isActive: c === true } : f))
                      }
                    />
                    <Label htmlFor="edit-svc-active" className="text-sm font-medium cursor-pointer">
                      Active
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-svc-incentive" className="text-sm">
                      Incentive %
                    </Label>
                    <Input
                      id="edit-svc-incentive"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      className="w-20"
                      value={editForm.incentivePercent}
                      onChange={(e) =>
                        setEditForm((f) => (f ? { ...f, incentivePercent: e.target.value } : f))
                      }
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditOpen(false);
                      setEditTarget(null);
                      setEditForm(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete service?</DialogTitle>
              <DialogDescription>
                {deleteTarget ? (
                  <>
                    This removes <span className="font-medium text-foreground">{deleteTarget.name}</span>{" "}
                    from the catalog for this session. Job cards that already reference it are unchanged.
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function ServiceCard({
  service,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: {
  service: ServiceCatalogItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg bg-primary/10 mt-0.5">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm leading-snug">{service.name}</h3>
                {service.isHighEnd && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  >
                    <Sparkles className="w-3 h-3" />
                    High-End
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 self-start pt-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  aria-label="Edit service"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit service</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  aria-label="Delete service"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete service</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{service.category}</span>
          </div>
          <span className="font-semibold text-sm">
            {formatCurrency(service.defaultPrice)}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <ToggleRight
              className={`w-4 h-4 ${
                service.isActive ? "text-emerald-500" : "text-gray-400"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                service.isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-muted-foreground"
              }`}
            >
              {service.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <Percent className="w-3 h-3" />
                {service.incentivePercent}% incentive
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mechanic incentive: {service.incentivePercent}% of service price</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-1 mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Hide segment pricing
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              View segment pricing
            </>
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Segment-wise pricing
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SEGMENT_KEYS.map((seg) => (
                <div
                  key={seg}
                  className="flex justify-between text-xs py-1 px-2 rounded bg-muted/50"
                >
                  <span>{SEGMENT_LABELS[seg]}</span>
                  <span className="font-medium">
                    {formatCurrency(service.segmentPricing[seg])}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {service.consumptionProfile &&
          service.consumptionProfile.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Package className="w-3 h-3" />
                Consumption profile
              </p>
              <ul className="space-y-1">
                {service.consumptionProfile.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex justify-between"
                  >
                    <span className="truncate">{item.partName}</span>
                    <span className="shrink-0 ml-2">
                      {item.quantityPerCar} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </CardContent>
    </Card>
  );
}

function PricingMatrixTable({ services }: { services: ServiceCatalogItem[] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left font-semibold p-4 sticky left-0 bg-muted/50 z-10 min-w-[180px]">
                Service
              </th>
              <th className="text-left font-semibold p-3 text-muted-foreground min-w-[100px]">
                Category
              </th>
              {SEGMENT_KEYS.map((seg) => (
                <th
                  key={seg}
                  className="text-right font-semibold p-3 min-w-[90px]"
                >
                  {SEGMENT_LABELS[seg]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((service, idx) => (
              <tr
                key={service.id}
                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                  idx % 2 === 1 ? "bg-muted/20" : ""
                }`}
              >
                <td className="p-4 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    {service.isHighEnd && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      >
                        High-End
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {service.description}
                  </p>
                </td>
                <td className="p-3 text-muted-foreground">{service.category}</td>
                {SEGMENT_KEYS.map((seg) => (
                  <td
                    key={seg}
                    className="p-3 text-right font-medium tabular-nums"
                  >
                    {formatCurrency(service.segmentPricing[seg])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
