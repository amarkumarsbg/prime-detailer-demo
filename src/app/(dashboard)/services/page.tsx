"use client";

import { useState, useMemo } from "react";
import { serviceCatalog } from "@/lib/mock-data";
import type { ServiceCatalogItem, SegmentPricing } from "@/types";
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
} from "lucide-react";
import { toast } from "sonner";

const SEGMENT_LABELS: Record<keyof SegmentPricing, string> = {
  HATCHBACK: "Hatchback",
  SEDAN: "Sedan",
  SUV: "SUV",
  LUXURY: "Luxury",
  MUV: "MUV",
  COMPACT_SUV: "Compact SUV",
};

const SEGMENT_KEYS = Object.keys(SEGMENT_LABELS) as (keyof SegmentPricing)[];

const categories = Array.from(new Set(serviceCatalog.map((s) => s.category)));

export default function ServicesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = serviceCatalog;
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
  }, [search, categoryFilter]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success("Service added successfully");
    setDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Service Catalog"
          description="Manage your service offerings and pricing"
          actions={
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Service</DialogTitle>
                  <DialogDescription>
                    Add a new service to the catalog.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="svc-name">Service Name</Label>
                    <Input
                      id="svc-name"
                      placeholder="e.g. Oil Change"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="svc-desc">Description</Label>
                    <Input
                      id="svc-desc"
                      placeholder="Brief description"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="svc-category">Category</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new">+ New Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="svc-price">Base Price (₹)</Label>
                      <Input
                        id="svc-price"
                        type="number"
                        placeholder="0"
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
                            htmlFor={`seg-${seg}`}
                            className="text-xs text-muted-foreground"
                          >
                            {SEGMENT_LABELS[seg]}
                          </Label>
                          <Input
                            id={`seg-${seg}`}
                            type="number"
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="svc-high-end" />
                      <Label
                        htmlFor="svc-high-end"
                        className="text-sm font-medium cursor-pointer"
                      >
                        High-end service
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="svc-incentive" className="text-sm">
                        Incentive %
                      </Label>
                      <Input
                        id="svc-incentive"
                        type="number"
                        placeholder="0"
                        min={0}
                        max={100}
                        step={0.5}
                        className="w-20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Service</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
      </div>
    </TooltipProvider>
  );
}

function ServiceCard({
  service,
  isExpanded,
  onToggleExpand,
}: {
  service: ServiceCatalogItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">{service.name}</h3>
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
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {service.description}
              </p>
            </div>
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
