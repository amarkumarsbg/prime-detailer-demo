"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { SegmentPricing, ServiceCatalogItem } from "@/types";

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
  const avg =
    SEGMENT_KEYS.reduce((a, k) => a + segmentPricing[k], 0) / SEGMENT_KEYS.length;
  return {
    ...base,
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    defaultPrice: Math.max(0, Math.round(avg)),
    segmentPricing,
    isHighEnd: form.isHighEnd,
    isActive: form.isActive,
    incentivePercent: Math.min(100, Math.max(0, parseFloat(form.incentivePercent) || 0)),
  };
}

export function EditServiceCatalogDialog({
  open,
  onOpenChange,
  service,
  categories,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  service: ServiceCatalogItem | null;
  categories: string[];
  onSave: (next: ServiceCatalogItem) => void;
}) {
  const [form, setForm] = useState<EditFormState | null>(null);

  useEffect(() => {
    if (service && open) setForm(serviceToForm(service));
    if (!open) setForm(null);
  }, [service, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !form) return;
    if (!form.name.trim()) return;
    onSave(formToService(service, form));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Package</DialogTitle>
          <DialogDescription>
            Update details for {service?.name ?? "this service"}.
          </DialogDescription>
        </DialogHeader>
        {form && service && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="esp-name">
                Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="esp-name"
                value={form.name}
                onChange={(e) => setForm((f) => (f ? { ...f, name: e.target.value } : f))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="esp-cat">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => (f ? { ...f, category: v } : f))}
              >
                <SelectTrigger id="esp-cat">
                  <SelectValue />
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
              <Label htmlFor="esp-desc">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="esp-desc"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, description: e.target.value } : f))
                }
                required
                className="resize-y min-h-[100px]"
              />
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/25 dark:border-emerald-900 p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                Pricing (incl. GST)
              </p>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
                Enter the price the customer pays. GST will be extracted automatically for accounting.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["BIKE", "HATCHBACK", "SEDAN", "SUV"] as const).map((seg) => (
                  <div key={seg} className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">{SEGMENT_LABELS[seg]}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.segmentPricing[seg]}
                      onChange={(e) =>
                        setForm((f) =>
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
              <p className="text-xs text-muted-foreground">Other segments below — full matrix</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SEGMENT_KEYS.filter((k) => !["BIKE", "HATCHBACK", "SEDAN", "SUV"].includes(k)).map(
                  (seg) => (
                    <div key={seg} className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">{SEGMENT_LABELS[seg]}</Label>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-sm"
                        value={form.segmentPricing[seg]}
                        onChange={(e) =>
                          setForm((f) =>
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
                  )
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="esp-high"
                  checked={form.isHighEnd}
                  onCheckedChange={(c) =>
                    setForm((f) => (f ? { ...f, isHighEnd: c === true } : f))
                  }
                />
                <Label htmlFor="esp-high">High-end service</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="esp-act"
                  checked={form.isActive}
                  onCheckedChange={(c) =>
                    setForm((f) => (f ? { ...f, isActive: c === true } : f))
                  }
                />
                <Label htmlFor="esp-act">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="esp-inc">Incentive %</Label>
                <Input
                  id="esp-inc"
                  type="number"
                  min={0}
                  max={100}
                  className="w-20 h-9"
                  value={form.incentivePercent}
                  onChange={(e) =>
                    setForm((f) => (f ? { ...f, incentivePercent: e.target.value } : f))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
