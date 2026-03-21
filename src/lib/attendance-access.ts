import type { UserRole } from "@/types";

/** Shop attendance dashboard (records, QR, summaries) — not the public punch page. */
export function canViewStaffAttendanceDashboard(role: UserRole | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
