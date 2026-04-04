"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type KPICardTone =
  | "emerald"
  | "blue"
  | "amber"
  | "violet"
  | "orange"
  | "slate"
  | "rose";

const toneIconClass: Record<KPICardTone, string> = {
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  amber:
    "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  violet:
    "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  orange:
    "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  slate:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** e.g. "All branches" under the metric (competitor-style scope). */
  footerNote?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  tone?: KPICardTone;
  variant?: "default" | "featured";
}

export function KPICard({
  title,
  value,
  subtitle,
  footerNote,
  icon: Icon,
  trend,
  className,
  tone,
  variant = "default",
}: KPICardProps) {
  const isFeatured = variant === "featured";

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col hover:shadow-md transition-shadow",
        isFeatured &&
          "border-emerald-200/70 shadow-sm dark:border-emerald-900/60",
        className
      )}
    >
      {/* Plain div: CardContent forces pt-0 on sm+ and pins content to the top. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={cn(
                "font-bold tracking-tight",
                isFeatured ? "text-3xl" : "text-2xl"
              )}
            >
              {value}
            </p>
            {(subtitle || trend) && (
              <div className="flex flex-wrap items-center gap-2">
                {trend && (
                  <span
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded",
                      trend.isPositive
                        ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950"
                        : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950"
                    )}
                  >
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </span>
                )}
                {subtitle && (
                  <span className="text-xs text-muted-foreground">
                    {subtitle}
                  </span>
                )}
              </div>
            )}
            {footerNote && (
              <p className="text-xs text-muted-foreground pt-0.5">{footerNote}</p>
            )}
          </div>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-xl",
              isFeatured ? "h-12 w-12" : "h-11 w-11",
              tone
                ? toneIconClass[tone]
                : "bg-primary/10 text-primary"
            )}
          >
            <Icon className={isFeatured ? "h-6 w-6" : "h-5 w-5"} />
          </div>
        </div>
      </div>
    </Card>
  );
}
