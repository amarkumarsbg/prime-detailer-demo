"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { branches, jobCards } from "@/lib/mock-data";
import { useStaffStore, generateRandomAttendancePin } from "@/store/staff-store";
import { useAuthStore } from "@/store/auth-store";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";
import { JobCardStatusBadge } from "@/components/shared/status-badge";
import { ArrowLeft, Mail, Phone, MapPin, Shield, ClipboardList, CheckCircle2, Clock, IndianRupee, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  MECHANIC: "Mechanic",
};

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const member = useStaffStore((s) => s.staff.find((row) => row.id === id));
  const updateAttendancePin = useStaffStore((s) => s.updateAttendancePin);

  const [pinInput, setPinInput] = useState("");
  useEffect(() => {
    if (member) setPinInput(member.attendancePin ?? "");
  }, [member?.id, member?.attendancePin]);

  const canEditAttendancePin =
    user?.role === "ADMIN" || user?.role === "MANAGER";

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Staff member not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/staff")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Staff
        </Button>
      </div>
    );
  }

  const branch = branches.find((b) => b.id === member.branchId);
  const assignedJobs = jobCards.filter((j) => j.mechanicId === member.id);

  const handleSaveAttendancePin = () => {
    if (!member) return;
    const result = updateAttendancePin(member.id, pinInput);
    if (!result.ok) {
      if (result.error === "DUPLICATE") {
        toast.error("Another team member already uses this PIN.");
      } else {
        toast.error("Use 4–8 digits for the PIN.");
      }
      return;
    }
    toast.success("Attendance PIN saved.");
  };

  const handleGenerateAttendancePin = () => {
    if (!member) return;
    for (let i = 0; i < 60; i++) {
      const candidate = generateRandomAttendancePin();
      const result = updateAttendancePin(member.id, candidate);
      if (result.ok) {
        setPinInput(candidate);
        toast.success("New PIN generated.");
        return;
      }
    }
    toast.error("Could not generate a unique PIN. Try again.");
  };
  const completedJobs = assignedJobs.filter((j) => j.status === "DELIVERED");
  const activeJobs = assignedJobs.filter((j) => !["DELIVERED", "CANCELLED"].includes(j.status));

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs items={[
        { label: "Staff", href: "/staff" },
        { label: member.name },
      ]} />

      <Card>
        <CardContent className="p-6!">
          <div className="flex flex-col sm:flex-row sm:items-center items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-bold">{member.name}</h2>
                <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <Shield className="w-3 h-3" />
                  {ROLE_LABELS[member.role]}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />{member.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />{member.phone}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />{branch?.name ?? "—"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignedJobs.length}</p>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{member.totalJobsCompleted ?? completedJobs.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeJobs.length}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        {(member.totalIncentiveEarned != null && member.totalIncentiveEarned > 0) && (
          <Card>
            <CardContent className="p-5! flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <IndianRupee className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(member.totalIncentiveEarned)}
                </p>
                <p className="text-sm text-muted-foreground">Incentive Earned</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {canEditAttendancePin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Attendance PIN
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Used at the store QR punch terminal. Keep it private. Stored in this browser for the demo only—in production, PINs would be hashed on the server.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="attendance-pin">PIN (4–8 digits)</Label>
              <Input
                id="attendance-pin"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 4521"
                value={pinInput}
                onChange={(e) =>
                  setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSaveAttendancePin}>
                Save PIN
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateAttendancePin}
              >
                Generate random
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {assignedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assigned Job Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedJobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/job-cards/${job.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{job.jobNumber}</p>
                    <p className="text-xs text-muted-foreground">{job.customerName} &middot; {job.vehicleRegNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{formatDate(job.createdAt)}</span>
                    <JobCardStatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
