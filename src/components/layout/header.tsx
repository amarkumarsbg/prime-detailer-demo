"use client";

import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useNotificationStore } from "@/store/notification-store";
import { useCustomerStore } from "@/store/customer-store";
import { useJobCardStore } from "@/store/job-card-store";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "./notification-panel";
import { Bell, LogOut, Moon, Sun, User, Building2, Menu, Search, Users, ClipboardList, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

export function Header() {
  const { user, currentBranch, logout } = useAuthStore();
  const toggleMobileOpen = useSidebarStore((s) => s.toggleMobileOpen);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { customers } = useCustomerStore();
  const { jobCards } = useJobCardStore();

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

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return { customers: [], jobCards: [] };

    const matchedCustomers = customers
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        c.email.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matchedJobs = jobCards
      .filter((j) =>
        j.jobNumber.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        j.vehicleRegNumber.toLowerCase().includes(q) ||
        j.vehicleMakeModel?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { customers: matchedCustomers, jobCards: matchedJobs };
  }, [searchQuery, customers, jobCards]);

  const hasResults = searchResults.customers.length > 0 || searchResults.jobCards.length > 0;
  const showDropdown = searchFocused && searchQuery.trim().length >= 2;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  const count = unreadCount();

  return (
    <header className="shrink-0 z-30 h-16 border-b border-sidebar-border bg-background flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileOpen}
          className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          <span className="font-medium text-foreground truncate max-w-[200px]">{currentBranch?.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative" ref={searchRef}>
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-muted/50 text-sm transition-colors focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search..."
              className="bg-transparent outline-none text-sm placeholder:text-muted-foreground w-24 sm:w-48 lg:w-64"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="shrink-0">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            {!searchQuery && (
              <kbd className="hidden sm:inline-flex pointer-events-none h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">&#8984;</span>K
              </kbd>
            )}
          </div>

          {showDropdown && (
            <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-80 sm:w-96 rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden">
              {!hasResults ? (
                <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {searchResults.customers.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Customers</p>
                      {searchResults.customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { router.push(`/customers/${c.id}`); setSearchFocused(false); setSearchQuery(""); }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                        >
                          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground text-xs ml-1.5">{c.phone}</span>
                            {c.email && <span className="text-muted-foreground text-xs ml-1">· {c.email}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.jobCards.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-t border-border mt-1 pt-1.5">Job Cards</p>
                      {searchResults.jobCards.map((j) => (
                        <button
                          key={j.id}
                          onClick={() => { router.push(`/job-cards/${j.id}`); setSearchFocused(false); setSearchQuery(""); }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
                        >
                          <ClipboardList className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{j.jobNumber}</span>
                            <span className="text-muted-foreground text-xs ml-1.5">{j.customerName}</span>
                            <span className="text-muted-foreground text-xs ml-1">· {j.vehicleRegNumber}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-accent transition-colors"
          >
            <Bell className="w-4 h-4" />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              {/* Mobile: backdrop + fixed full-width panel */}
              <div className="sm:hidden">
                <div className="fixed inset-0 top-14 z-40 bg-black/30" onClick={() => setNotifOpen(false)} />
                <div className="fixed inset-x-0 top-14 z-50 px-3 pt-2">
                  <div className="rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 slide-in-from-top-2">
                    <NotificationPanel onClose={() => setNotifOpen(false)} />
                  </div>
                </div>
              </div>
              {/* Desktop: absolute dropdown */}
              <div className="hidden sm:block absolute right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              </div>
            </>
          )}
        </div>

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
    </header>
  );
}
