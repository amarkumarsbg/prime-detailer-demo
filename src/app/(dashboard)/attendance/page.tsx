"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { KPICard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttendanceStore } from "@/store/attendance-store";
import { useStaffStore } from "@/store/staff-store";
import { useAuthStore } from "@/store/auth-store";
import { AttendanceQrPanel } from "@/components/attendance/attendance-qr-panel";
import { format } from "date-fns";
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { getShiftStatusDisplay } from "@/lib/attendance-display";

function formatDuration(minutes?: number): string {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function AttendancePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const currentBranch = useAuthStore((s) => s.currentBranch);
  const attendanceRecords = useAttendanceStore((s) => s.records);
  const staff = useStaffStore((s) => s.staff);

  const branchId = currentBranch?.id ?? user?.branchId ?? "br-001";

  useEffect(() => {
    if (user && user.role !== "ADMIN" && user.role !== "MANAGER") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);

  const dateOptions = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(format(d, "yyyy-MM-dd"));
    }
    return dates;
  }, []);

  const staffForBranch = useMemo(
    () => staff.filter((s) => s.branchId === branchId),
    [branchId]
  );

  const recordsForDate = useMemo(() => {
    const list = attendanceRecords.filter(
      (r) => r.date === selectedDate && r.branchId === branchId
    );
    return [...list].sort((a, b) => a.staffName.localeCompare(b.staffName));
  }, [attendanceRecords, selectedDate, branchId]);

  const todayRecords = useMemo(
    () =>
      attendanceRecords.filter((r) => r.date === today && r.branchId === branchId),
    [attendanceRecords, today, branchId]
  );

  const kpis = useMemo(() => {
    const present = todayRecords.filter((r) => r.status === "PRESENT").length;
    const late = todayRecords.filter((r) => r.status === "LATE").length;
    const absent = todayRecords.filter((r) => r.status === "ABSENT").length;
    const withDuration = todayRecords.filter(
      (r) => r.durationMinutes != null && r.durationMinutes > 0
    );
    const avgHours =
      withDuration.length > 0
        ? (
            withDuration.reduce((s, r) => s + (r.durationMinutes ?? 0), 0) /
            withDuration.length /
            60
          ).toFixed(1)
        : "0";

    return { present, late, absent, avgHours };
  }, [todayRecords]);

  const absenceAlerts = useMemo(() => {
    const cutoff = "09:30";
    return staffForBranch.filter((s) => {
      const record = todayRecords.find((r) => r.staffId === s.id);
      if (!record) return true;
      if (record.status === "ABSENT") return true;
      if (!record.checkIn) return true;
      if (record.checkIn > cutoff) return true;
      return false;
    });
  }, [todayRecords, staffForBranch]);

  const staffSummary = useMemo(() => {
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - 6);
    const startStr = format(startDate, "yyyy-MM-dd");
    const periodRecords = attendanceRecords.filter(
      (r) =>
        r.branchId === branchId &&
        r.date <= selectedDate &&
        r.date >= startStr
    );
    return staffForBranch.map((s) => {
      const staffRecords = periodRecords.filter((r) => r.staffId === s.id);
      const present = staffRecords.filter((r) => r.status === "PRESENT").length;
      const absent = staffRecords.filter((r) => r.status === "ABSENT").length;
      const late = staffRecords.filter((r) => r.status === "LATE").length;
      const halfDay = staffRecords.filter((r) => r.status === "HALF_DAY").length;
      const withDuration = staffRecords.filter(
        (r) => r.durationMinutes != null && r.durationMinutes > 0
      );
      const avgHours =
        withDuration.length > 0
          ? (
              withDuration.reduce((sum, r) => sum + (r.durationMinutes ?? 0), 0) /
              withDuration.length /
              60
            ).toFixed(1)
          : "0";
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        present,
        absent,
        late,
        halfDay,
        avgHours,
      };
    });
  }, [selectedDate, attendanceRecords, branchId, staffForBranch]);

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN" && user.role !== "MANAGER") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Staff Attendance"
          description="Live view — QR + PIN punch, check-in/out, and hours"
        />
        <Badge variant="success" className="w-fit shrink-0">
          Live
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Present Today"
              value={kpis.present}
              subtitle="staff"
              icon={UserCheck}
            />
            <KPICard
              title="Late Today"
              value={kpis.late}
              subtitle="staff"
              icon={Clock}
            />
            <KPICard
              title="Absent Today"
              value={kpis.absent}
              subtitle="staff"
              icon={UserX}
            />
            <KPICard
              title="Average Hours"
              value={`${kpis.avgHours}h`}
              subtitle="today"
              icon={Clock}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AttendanceQrPanel defaultBranchId={branchId} />

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Absence Alerts
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Not checked in by 9:30 AM today
                </span>
              </CardHeader>
              <CardContent>
                {absenceAlerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    All staff have checked in on time
                  </p>
                ) : (
                  <div className="space-y-2">
                    {absenceAlerts.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-amber-50/50 dark:bg-amber-950/20"
                      >
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.role}</p>
                        </div>
                        <Badge variant="warning">Not checked in</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Attendance Records
              </CardTitle>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {format(new Date(d), "EEE, MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-semibold">Staff Name</th>
                      <th className="text-left py-3 px-2 font-semibold">Role</th>
                      <th className="text-left py-3 px-2 font-semibold">Date</th>
                      <th className="text-left py-3 px-2 font-semibold">Check-In</th>
                      <th className="text-left py-3 px-2 font-semibold">Check-Out</th>
                      <th className="text-left py-3 px-2 font-semibold">Duration</th>
                      <th className="text-left py-3 px-2 font-semibold">Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recordsForDate.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No attendance records for this date
                        </td>
                      </tr>
                    ) : (
                      recordsForDate.map((r) => {
                        const shift = getShiftStatusDisplay(r);
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-2 font-medium">{r.staffName}</td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {r.staffRole}
                            </td>
                            <td className="py-3 px-2">
                              {format(new Date(r.date), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 px-2">{r.checkIn ?? "—"}</td>
                            <td className="py-3 px-2">{r.checkOut ?? "—"}</td>
                            <td className="py-3 px-2">
                              {formatDuration(r.durationMinutes)}
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={shift.variant}>{shift.label}</Badge>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold">
                  Staff-wise Attendance Summary
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Last 7 days from selected date
                </p>
              </div>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {format(new Date(d), "EEE, MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {staffSummary.map((s) => (
                  <Card key={s.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground mb-3">{s.role}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="success" className="text-[10px]">
                          P: {s.present}
                        </Badge>
                        <Badge variant="destructive" className="text-[10px]">
                          A: {s.absent}
                        </Badge>
                        <Badge variant="warning" className="text-[10px]">
                          L: {s.late}
                        </Badge>
                        {s.halfDay > 0 && (
                          <Badge variant="info" className="text-[10px]">
                            H: {s.halfDay}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Avg: {s.avgHours}h
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
