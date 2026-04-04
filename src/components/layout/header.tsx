"use client";

import { useAuthStore } from "@/store/auth-store";
import { useBranchStore } from "@/store/branch-store";
import { useSettingsStore } from "@/store/settings-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useNotificationStore } from "@/store/notification-store";
import { useCustomerStore } from "@/store/customer-store";
import { useJobCardStore } from "@/store/job-card-store";
import { useVehicleStore } from "@/store/vehicle-store";
import { useInvoiceStore } from "@/store/invoice-store";
import { useQuotationStore } from "@/store/quotation-store";
import { useStaffStore } from "@/store/staff-store";
import { useAppointmentStore } from "@/store/appointment-store";
import { useInventoryStore } from "@/store/inventory-store";
import { useExpenseStore } from "@/store/expense-store";
import { serviceCatalog } from "@/lib/mock-data";
import { ALL_BRANCHES_BRANCH, isAllBranchesScope } from "@/lib/all-branches";
import {
  GLOBAL_SEARCH_MIN_CHARS,
  runGlobalSearch,
  type GlobalSearchSectionKey,
} from "@/lib/global-search";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "./notification-panel";
import {
  Bell,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
  Search,
  Users,
  ClipboardList,
  X,
  Wrench,
  Building2,
  Car,
  FileText,
  Receipt,
  Calendar,
  UserCog,
  Package,
  Banknote,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

export function Header() {
  const { user, currentBranch, logout, setBranch } = useAuthStore();
  const branchesFromStore = useBranchStore((s) => s.branches);
  const businessName = useSettingsStore((s) => s.businessName);
  const toggleMobileOpen = useSidebarStore((s) => s.toggleMobileOpen);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customers = useCustomerStore((s) => s.customers);
  const jobCards = useJobCardStore((s) => s.jobCards);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const invoices = useInvoiceStore((s) => s.invoices);
  const quotations = useQuotationStore((s) => s.quotations);
  const staff = useStaffStore((s) => s.staff);
  const appointments = useAppointmentStore((s) => s.appointments);
  const parts = useInventoryStore((s) => s.parts);
  const expenses = useExpenseStore((s) => s.expenses);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    if (notifOpen || searchFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, searchFocused]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === "Escape") {
        setSearchFocused(false);
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const searchSections = useMemo(
    () =>
      runGlobalSearch(searchQuery, {
        customers,
        vehicles,
        jobCards,
        quotations,
        invoices,
        staff,
        appointments,
        parts,
        serviceCatalog,
        expenses,
      }),
    [
      searchQuery,
      customers,
      vehicles,
      jobCards,
      quotations,
      invoices,
      staff,
      appointments,
      parts,
      expenses,
    ]
  );

  const hasResults = searchSections.length > 0;
  const showDropdown =
    searchFocused && searchQuery.trim().length >= GLOBAL_SEARCH_MIN_CHARS;

  const sectionIcon = (key: GlobalSearchSectionKey) => {
    const map: Record<GlobalSearchSectionKey, typeof Users> = {
      customers: Users,
      vehicles: Car,
      jobCards: ClipboardList,
      quotations: FileText,
      invoices: Receipt,
      appointments: Calendar,
      staff: UserCog,
      parts: Package,
      services: Wrench,
      expenses: Banknote,
    };
    return map[key];
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const canSelectOrgWide = useMemo(
    () =>
      !!user &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        user.role === "MANAGER"),
    [user]
  );

  const selectableBranches = useMemo(() => {
    const active = branchesFromStore.filter((b) => b.isActive);
    if (!user) return active;
    if (canSelectOrgWide) return active;
    return active.filter((b) => b.id === user.branchId);
  }, [branchesFromStore, user, canSelectOrgWide]);

  useEffect(() => {
    if (!user) return;
    if (canSelectOrgWide) return;
    const mine =
      selectableBranches.find((b) => b.id === user.branchId) ?? selectableBranches[0];
    if (!mine) return;
    if (
      !currentBranch ||
      isAllBranchesScope(currentBranch) ||
      !selectableBranches.some((b) => b.id === currentBranch.id)
    ) {
      setBranch(mine);
    }
  }, [user, canSelectOrgWide, currentBranch, selectableBranches, setBranch]);

  if (!user) return null;

  const count = unreadCount();

  const searchInner = (
    <>
      <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-muted/50 text-sm transition-colors focus-within:ring-1 focus-within:ring-primary focus-within:border-primary w-full">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Search customers, vehicles, jobs, invoices…"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              searchInputRef.current?.focus();
            }}
            className="shrink-0 rounded p-0.5 hover:bg-muted/80"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden">
          {!hasResults ? (
            <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
          ) : (
            <div className="max-h-[min(24rem,70vh)] overflow-y-auto py-1">
              {searchSections.map((section, sIdx) => {
                const Icon = sectionIcon(section.key);
                return (
                  <div key={section.key}>
                    <p
                      className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ${
                        sIdx > 0 ? "border-t border-border mt-1 pt-1.5" : ""
                      }`}
                    >
                      {section.label}
                    </p>
                    {section.hits.map((hit) => (
                      <button
                        key={`${section.key}-${hit.id}`}
                        type="button"
                        onClick={() => {
                          router.push(hit.href);
                          setSearchFocused(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium line-clamp-1">{hit.title}</span>
                          {hit.meta ? (
                            <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">{hit.meta}</p>
                          ) : null}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <header
      className="shrink-0 z-30 min-w-0 border-b border-border bg-background px-3 sm:px-4 md:px-6 py-2 md:py-0 md:h-16 max-md:grid max-md:grid-cols-[auto_minmax(0,1fr)_auto] max-md:gap-y-2 max-md:gap-x-1.5 sm:max-md:gap-x-2 max-md:[grid-template-areas:'hdr_logo_hdr_branch_hdr_tools'_'hdr_search_hdr_search_hdr_search'] md:flex md:flex-nowrap md:items-center md:gap-3"
    >
      {/* Mobile only — company logo (desktop branding lives in the sidebar) */}
      <Link
        href="/dashboard"
        className="md:hidden max-md:[grid-area:hdr_logo] flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary shrink-0">
          <Wrench className="w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5 text-primary-foreground" />
        </div>
        <div className="hidden min-[380px]:flex flex-col leading-tight min-w-0">
          <span className="text-xs sm:text-sm font-bold text-foreground truncate max-w-[5.5rem] min-[380px]:max-w-[7rem] sm:max-w-[120px]">
            {businessName}
          </span>
          <span className="text-[10px] text-muted-foreground hidden sm:block truncate">Service Management</span>
        </div>
      </Link>

      <div className="max-md:[grid-area:hdr_branch] max-md:min-w-0 max-md:w-full max-md:max-w-full max-md:self-center md:order-1 md:flex md:shrink-0 md:min-w-0 md:max-w-none">
        <Select
          value={currentBranch?.id ?? ALL_BRANCHES_BRANCH.id}
          onValueChange={(id) => {
            if (id === ALL_BRANCHES_BRANCH.id) {
              setBranch(ALL_BRANCHES_BRANCH);
              return;
            }
            const next = selectableBranches.find((b) => b.id === id);
            if (next) setBranch(next);
          }}
          disabled={!canSelectOrgWide && selectableBranches.length === 0}
        >
          <SelectTrigger className="h-9 min-h-9 w-full max-w-full md:w-max md:max-w-[min(100vw-5rem,17.5rem)] justify-start gap-1.5 sm:gap-2 border-border bg-muted/50 px-2 sm:px-2.5 md:px-3 text-left text-sm shadow-none [&>span]:min-w-0 max-md:[&>span]:truncate md:[&>span]:line-clamp-none md:[&>span]:break-words md:[&>span]:whitespace-normal">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0 self-center" />
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent align="start" className="max-h-[min(24rem,70vh)] min-w-[var(--radix-select-trigger-width)]">
            {canSelectOrgWide && (
              <SelectItem value={ALL_BRANCHES_BRANCH.id}>{ALL_BRANCHES_BRANCH.name}</SelectItem>
            )}
            {selectableBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-0.5 sm:gap-1 shrink-0 max-md:[grid-area:hdr_tools] max-md:self-center md:order-3 md:ml-0 md:justify-center">
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-accent transition-colors"
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            ) : (
              <Moon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            )}
          </button>
        )}

        <div className="relative shrink-0" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="size-4 shrink-0" />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="sm:hidden">
                <div
                  className="fixed inset-0 z-40 bg-black/30 cursor-pointer top-24 md:top-14"
                  onClick={() => setNotifOpen(false)}
                  aria-hidden
                />
                <div className="fixed inset-x-0 z-50 px-3 pt-2 top-24 md:top-14">
                  <div className="rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 slide-in-from-top-2">
                    <NotificationPanel onClose={() => setNotifOpen(false)} />
                  </div>
                </div>
              </div>
              <div className="hidden sm:block absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              </div>
            </>
          )}
        </div>

        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 sm:gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors ml-1">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground">{user.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          type="button"
          onClick={toggleMobileOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-accent transition-colors md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5 shrink-0" />
        </button>
      </div>

      <div
        className="max-md:[grid-area:hdr_search] max-md:w-full max-md:min-w-0 max-md:flex max-md:justify-center max-md:self-center md:order-2 md:flex-1 md:w-auto md:basis-auto md:min-w-[12rem] flex justify-center"
        ref={searchRef}
      >
        <div className="relative w-full max-w-md">{searchInner}</div>
      </div>
    </header>
  );
}
