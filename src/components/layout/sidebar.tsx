"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebar-store";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardFilterStore } from "@/store/dashboard-filter-store";
import { useSettingsStore } from "@/store/settings-store";
import type { UserRole } from "@/types";
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
  User,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Job Cards", href: "/job-cards", icon: ClipboardList },
      { label: "Quotations", href: "/quotations", icon: FileText },
      { label: "Appointments", href: "/appointments", icon: Calendar },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Vehicles", href: "/vehicles", icon: Car },
      { label: "Reminders", href: "/reminders", icon: Bell, roles: ["ADMIN", "MANAGER", "RECEPTIONIST"] },
      { label: "Follow-ups", href: "/follow-ups", icon: PhoneCall, roles: ["ADMIN", "MANAGER", "RECEPTIONIST"] },
      { label: "Staff", href: "/staff", icon: UserCog, roles: ["ADMIN", "MANAGER"] },
      { label: "Attendance", href: "/attendance", icon: QrCode, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Services", href: "/services", icon: Wrench, roles: ["ADMIN", "MANAGER"] },
      { label: "Inventory", href: "/inventory", icon: Package, roles: ["ADMIN", "MANAGER"] },
      { label: "Billing", href: "/billing", icon: Receipt, roles: ["ADMIN", "MANAGER", "RECEPTIONIST"] },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Mechanics", href: "/mechanics", icon: Gauge, roles: ["ADMIN", "MANAGER"] },
      { label: "Expenses", href: "/expenses", icon: Banknote, roles: ["ADMIN", "MANAGER"] },
      { label: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
      { label: "Activity Log", href: "/activity", icon: History, roles: ["ADMIN"] },
      { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

function SidebarContent({
  onNavClick,
  navOverflow = "hidden",
}: {
  onNavClick?: () => void;
  /** Desktop: hidden = no scrollbar; mobile drawer: auto if list is taller than screen */
  navOverflow?: "hidden" | "auto";
}) {
  const pathname = usePathname();
  const userRole = useAuthStore((s) => s.user?.role);
  const clearDashboardFilter = useDashboardFilterStore((s) => s.setActiveFilter);

  const filteredGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || (userRole && item.roles.includes(userRole))),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav
      className={cn(
        "flex-1 min-h-0 py-2 px-2 space-y-1 overflow-x-hidden",
        navOverflow === "hidden" && "overflow-y-hidden overscroll-none",
        navOverflow === "auto" && "overflow-y-auto overscroll-y-contain scrollbar-none"
      )}
    >
      {filteredGroups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 px-2.5">
            {group.label}
          </p>
          <div className="space-y-px">
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (item.href === "/job-cards") clearDashboardFilter(null);
                    onNavClick?.();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ onNavClick }: { onNavClick?: () => void }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    onNavClick?.();
    router.push("/login");
  };

  return (
    <div className="shrink-0 border-t border-sidebar-border p-2 space-y-1 bg-sidebar">
      <Link
        href="/profile"
        onClick={onNavClick}
        className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <User className="w-4 h-4 shrink-0" />
        <span>Profile</span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium transition-colors cursor-pointer text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span>Log out</span>
      </button>
    </div>
  );
}

export function Sidebar() {
  const { mobileOpen, setMobileOpen } = useSidebarStore();
  const businessName = useSettingsStore((s) => s.businessName);

  return (
    <>
      {/* Desktop Sidebar — always expanded; no collapse control */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-[100dvh] max-h-screen w-[250px] flex-col transition-all duration-300 min-h-0">
        <div className="flex items-center h-16 border-b border-r border-sidebar-border bg-background px-4 shrink-0 gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="overflow-hidden min-w-0">
            <h1 className="text-base font-bold text-foreground leading-tight">{businessName}</h1>
            <p className="text-[11px] text-muted-foreground truncate">Service Management</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden min-h-0">
          <SidebarContent navOverflow="auto" />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] max-h-screen min-h-0 w-[280px] border-r border-sidebar-border bg-sidebar flex flex-col transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-foreground leading-tight">{businessName}</h1>
              <p className="text-[11px] text-muted-foreground truncate">Service Management</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-sidebar-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SidebarContent onNavClick={() => setMobileOpen(false)} navOverflow="auto" />
        </div>
        <SidebarFooter onNavClick={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
