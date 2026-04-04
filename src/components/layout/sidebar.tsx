"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import { useSettingsStore } from "@/store/settings-store";
import type { UserRole } from "@/types";
import { canAccessNavItem } from "@/lib/rbac";
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Receipt,
  Wrench,
  X,
  UserCog,
  Package,
  Calendar,
  BarChart3,
  Banknote,
  History,
  Bell,
  Settings,
  Gauge,
  FileText,
  PhoneCall,
  QrCode,
  Wallet,
  Store,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
};

function navSectionSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Sidebar navigation clears dashboard drill-down filters (alerts use `setActiveFilter` before routing). */
const SIDEBAR_CLEAR_FILTER_HREFS = new Set([
  "/job-cards",
  "/inventory",
  "/customers",
  "/billing",
  "/reminders",
]);

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Job Cards", href: "/job-cards", icon: ClipboardList },
      { label: "Quotations", href: "/quotations", icon: FileText },
      { label: "Appointments", href: "/appointments", icon: Calendar },
    ],
  },
  {
    label: "Customers & fleet",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Vehicles", href: "/vehicles", icon: Car },
      { label: "Reminders", href: "/reminders", icon: Bell, roles: ["ADMIN", "MANAGER", "RECEPTIONIST"] },
      { label: "Follow-ups", href: "/follow-ups", icon: PhoneCall, roles: ["ADMIN", "MANAGER", "RECEPTIONIST"] },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Accounting",
        href: "/accounting",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "MANAGER", "RECEPTIONIST"],
      },
      {
        label: "Expenses",
        href: "/expenses",
        icon: Banknote,
        roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "MANAGER"],
      },
      {
        label: "Vendors",
        href: "/vendors",
        icon: Store,
        roles: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER", "MANAGER"],
      },
    ],
  },
  {
    label: "HR & staff",
    items: [
      { label: "Users & Staff", href: "/staff", icon: UserCog, roles: ["ADMIN", "MANAGER"] },
      { label: "Attendance", href: "/attendance", icon: QrCode, roles: ["ADMIN", "MANAGER"] },
      { label: "Salary & Payroll", href: "/payroll", icon: Wallet, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Workshop",
    items: [
      { label: "Services", href: "/services", icon: Wrench, roles: ["ADMIN", "MANAGER"] },
      { label: "Inventory", href: "/inventory", icon: Package, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Analytics & admin",
    items: [
      { label: "Mechanics", href: "/mechanics", icon: Gauge, roles: ["ADMIN", "MANAGER"] },
      { label: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
      { label: "Activity Log", href: "/activity", icon: History, roles: ["ADMIN"] },
      { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

function SidebarContent({
  onNavClick,
  navOverflow = "hidden",
  className,
}: {
  onNavClick?: () => void;
  navOverflow?: "hidden" | "auto";
  className?: string;
}) {
  const pathname = usePathname();
  const userRole = useAuthStore((s) => s.user?.role);
  const clearDashboardFilter = useDashboardFilterStore((s) => s.setActiveFilter);

  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessNavItem(item.roles, userRole)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav
      className={cn(
        "flex-1 min-h-0 py-3 px-2.5 space-y-3 overflow-x-hidden",
        navOverflow === "hidden" && "overflow-y-hidden overscroll-none",
        navOverflow === "auto" && "overflow-y-auto overscroll-y-contain scrollbar-none",
        className
      )}
    >
      {filteredGroups.map((group) => (
        <section
          key={group.label}
          className="rounded-xl border border-[var(--sidebar-border)] bg-[var(--sidebar-glow-dim)] shadow-[inset_0_1px_0_0_rgba(34,211,238,0.06)]"
          aria-labelledby={`nav-section-${navSectionSlug(group.label)}`}
        >
          <div className="flex items-stretch gap-2 px-2.5 pt-2.5 pb-1">
            <span
              className="w-0.5 shrink-0 rounded-full bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600 self-stretch min-h-[2rem] shadow-[0_0_8px_rgba(34,211,238,0.35)]"
              aria-hidden
            />
            <h2
              id={`nav-section-${navSectionSlug(group.label)}`}
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100/40 leading-tight pt-0.5"
            >
              {group.label}
            </h2>
          </div>
          <div className="space-y-px px-1.5 pb-1.5">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (SIDEBAR_CLEAR_FILTER_HREFS.has(item.href)) clearDashboardFilter(null);
                    onNavClick?.();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_4px_16px_-4px_rgba(6,182,212,0.55)]"
                      : "text-[var(--sidebar-foreground)] hover:bg-cyan-400/[0.08] hover:text-[var(--sidebar-accent-foreground)]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "opacity-100" : "opacity-80")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore();
  const businessName = useSettingsStore((s) => s.businessName);

  const brandHeader = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shrink-0 shadow-lg shadow-cyan-900/50 ring-1 ring-cyan-400/25">
        <Wrench className="w-5 h-5 text-white" />
      </div>
      <div className="overflow-hidden min-w-0">
        <h1 className="text-base font-bold text-[var(--sidebar-accent-foreground)] leading-tight truncate">
          {businessName}
        </h1>
        <p className="text-[11px] text-cyan-100/35 truncate">Service management</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-[100dvh] max-h-screen w-[260px] flex-col transition-all duration-300 min-h-0 bg-gradient-to-b from-[var(--sidebar)] via-[#080d18] to-[#0c1322] text-sidebar-foreground border-r border-[var(--sidebar-border)]">
        <div className="flex items-center h-16 px-4 shrink-0 border-b border-[var(--sidebar-border)] bg-cyan-400/[0.04]">
          {brandHeader}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0 bg-transparent">
          <SidebarContent className="flex-1 min-h-0" navOverflow="auto" />
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] max-h-screen min-h-0 w-[288px] flex flex-col transition-transform duration-300 md:hidden bg-gradient-to-b from-[var(--sidebar)] via-[#080d18] to-[#0c1322] text-sidebar-foreground border-r border-[var(--sidebar-border)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--sidebar-border)] shrink-0 bg-cyan-400/[0.04]">
          {brandHeader}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-cyan-200/45 hover:bg-cyan-500/10 hover:text-cyan-100 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SidebarContent
            className="flex-1 min-h-0"
            onNavClick={() => setMobileOpen(false)}
            navOverflow="auto"
          />
        </div>
      </aside>
    </>
  );
}
