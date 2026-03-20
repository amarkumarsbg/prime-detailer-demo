"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5!">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {(subtitle || trend) && (
              <div className="flex items-center gap-2">
                {trend && (
                  <span
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded",
                      trend.isPositive
                        ? "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950"
                        : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950"
                    )}
                  >
                    {trend.isPositive ? "+" : ""}{trend.value}%
                  </span>
                )}
                {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
