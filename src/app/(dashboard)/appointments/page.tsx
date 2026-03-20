"use client";

import { useState, useMemo } from "react";
import { customers, vehicles, serviceCatalog } from "@/lib/mock-data";
import { useStaffStore } from "@/store/staff-store";
import { useAppointmentStore } from "@/store/appointment-store";
import { useSettingsStore } from "@/store/settings-store";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
} from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Calendar,
  MessageCircle,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types";
import { toast } from "sonner";
import {
  buildBookingConfirmationMessage,
  buildWhatsAppBookingUrl,
  pickAppointmentForWhatsAppPreview,
} from "@/lib/booking-confirmation-message";

const STATUS_COLORS: Record<AppointmentStatus, { bg: string; text: string; dot: string }> = {
  SCHEDULED: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  CONFIRMED: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
  IN_PROGRESS: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  COMPLETED: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CANCELLED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
};

export default function AppointmentsPage() {
  const staff = useStaffStore((s) => s.staff);
  const appointments = useAppointmentStore((s) => s.appointments);
  const updateAppointment = useAppointmentStore((s) => s.updateAppointment);
  const businessName = useSettingsStore((s) => s.businessName);
  const businessPhone = useSettingsStore((s) => s.businessPhone);
  const businessEmail = useSettingsStore((s) => s.businessEmail);
  const businessAddress = useSettingsStore((s) => s.businessAddress);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 12));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 2, 12));

  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messagePreview, setMessagePreview] = useState("");
  const [messageTarget, setMessageTarget] = useState<Appointment | null>(null);

  const studioName = businessName.toLowerCase().includes("studio")
    ? businessName
    : `${businessName} Studio`;

  const businessPayload = useMemo(
    () => ({
      studioName,
      address: businessAddress,
      phone: businessPhone,
      email: businessEmail,
    }),
    [studioName, businessAddress, businessPhone, businessEmail]
  );

  const openConfirmationMessage = (apt: Appointment) => {
    const text = buildBookingConfirmationMessage(apt, businessPayload);
    setMessageTarget(apt);
    setMessagePreview(text);
    setMessageDialogOpen(true);
  };

  const openDemoWhatsAppPreview = () => {
    const apt = pickAppointmentForWhatsAppPreview(appointments);
    if (!apt) {
      toast.error("No appointments available");
      return;
    }
    openConfirmationMessage(apt);
  };

  const handleConfirmBooking = (apt: Appointment) => {
    if (apt.status !== "SCHEDULED") return;
    const next: Appointment = { ...apt, status: "CONFIRMED" };
    updateAppointment(apt.id, { status: "CONFIRMED" });
    openConfirmationMessage(next);
    toast.success("Booking confirmed");
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messagePreview);
      toast.success("Message copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleOpenWhatsApp = () => {
    if (!messageTarget) return;
    const url = buildWhatsAppBookingUrl(messageTarget, messagePreview);
    window.open(url, "_blank", "noopener,noreferrer");
    updateAppointment(messageTarget.id, { whatsappSent: true });
    toast.success("Message sent");
    setMessageDialogOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((apt) => {
      const key = apt.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(apt);
    });
    return map;
  }, [appointments]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return appointmentsByDate.get(key) ?? [];
  }, [selectedDate, appointmentsByDate]);

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .filter((a) => a.status !== "COMPLETED" && a.status !== "CANCELLED")
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [appointments]);

  const todayCount = appointmentsByDate.get(format(new Date(2026, 2, 12), "yyyy-MM-dd"))?.length ?? 0;
  const scheduledCount = appointments.filter((a) => a.status === "SCHEDULED").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Appointments"
        description="Schedule and manage service appointments"
        actions={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button type="button" variant="outline" onClick={openDemoWhatsAppPreview}>
              <Sparkles className="w-4 h-4 mr-2" />
              WhatsApp message
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />New Appointment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
                <DialogDescription>Book a service appointment for a customer.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Appointment scheduled"); setDialogOpen(false); }} className="space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select required>
                      <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle</Label>
                    <Select required>
                      <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                      <SelectContent>
                        {vehicles.slice(0, 10).map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select required>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {serviceCatalog.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mechanic (optional)</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Assign mechanic" /></SelectTrigger>
                      <SelectContent>
                        {staff.filter((s) => s.role === "MECHANIC").map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Notes (optional)</Label>
                    <Input placeholder="Any special instructions..." />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <Dialog
        open={messageDialogOpen}
        onOpenChange={(open) => {
          setMessageDialogOpen(open);
          if (!open) setMessageTarget(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Booking confirmation (WhatsApp)</DialogTitle>
            <DialogDescription>
              {messageTarget ? (
                <span className="text-foreground font-medium">
                  {messageTarget.customerName}{" "}
                  <span className="text-muted-foreground font-normal">
                    · {messageTarget.whatsappPhone ?? messageTarget.customerPhone} · {messageTarget.bookingId}
                  </span>
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 flex-1 min-h-0 overflow-y-auto border-y border-border">
            <Textarea
              readOnly
              value={messagePreview}
              className="min-h-[320px] max-h-[50vh] font-mono text-xs leading-relaxed resize-none border-0 bg-muted/30 focus-visible:ring-0 rounded-none px-3 py-3"
            />
          </div>
          <DialogFooter className="px-6 py-4 flex-row flex-wrap gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={handleCopyMessage}>
              <Copy className="w-4 h-4 mr-2" />
              Copy message
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setMessageDialogOpen(false)}>
                Close
              </Button>
              <Button type="button" onClick={handleOpenWhatsApp}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Clock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduledCount}</p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5! flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                  {calendarDays.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const dayAppts = appointmentsByDate.get(key) ?? [];
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrent = isToday(day);
                    const inMonth = isSameMonth(day, currentMonth);

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(day)}
                        className={`relative flex flex-col items-center justify-start p-1 sm:p-2 min-h-[48px] sm:min-h-[64px] rounded-lg transition-colors text-sm
                          ${!inMonth ? "text-muted-foreground/40" : ""}
                          ${isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50"}
                          ${isCurrent && !isSelected ? "bg-accent" : ""}
                        `}
                      >
                        <span className={`text-xs sm:text-sm font-medium ${isCurrent ? "text-primary font-bold" : ""}`}>
                          {format(day, "d")}
                        </span>
                        {dayAppts.length > 0 && (
                          <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                            {dayAppts.slice(0, 3).map((a) => (
                              <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[a.status].dot}`} />
                            ))}
                            {dayAppts.length > 3 && (
                              <span className="text-[9px] text-muted-foreground">+{dayAppts.length - 3}</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedDate ? format(selectedDate, "EEE, d MMM") : "Select a day"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No appointments for this day</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDayAppointments.map((apt) => {
                      const sc = STATUS_COLORS[apt.status];
                      return (
                        <div key={apt.id} className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{apt.time}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.text}`}>
                              {apt.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{apt.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.bookingId} &middot; {apt.vehicleRegNumber} &middot; {apt.serviceType}
                          </p>
                          <div className="flex flex-col gap-2 mt-3">
                            {apt.mechanicName && (
                              <p className="text-xs text-muted-foreground">Mechanic: {apt.mechanicName}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                              {apt.status === "SCHEDULED" && (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => handleConfirmBooking(apt)}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Confirm booking
                                </Button>
                              )}
                              {(apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS") && !apt.whatsappSent && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => openConfirmationMessage(apt)}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Send WhatsApp
                                </Button>
                              )}
                              {apt.whatsappSent && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                                  <Check className="w-3 h-3" /> WhatsApp sent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0! divide-y divide-border">
              {upcomingAppointments.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map((apt) => {
                  const sc = STATUS_COLORS[apt.status];
                  return (
                    <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${sc.bg}`}>
                        <Calendar className={`w-5 h-5 ${sc.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{apt.customerName}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.bg} ${sc.text}`}>
                            {apt.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">{apt.bookingId}</span>
                          {apt.whatsappSent && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3 h-3" /> WhatsApp sent
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {apt.vehicleRegNumber} &middot; {apt.serviceType}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {apt.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleConfirmBooking(apt)}
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Confirm booking
                          </Button>
                        )}
                        {(apt.status === "CONFIRMED" || apt.status === "IN_PROGRESS") && !apt.whatsappSent && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => openConfirmationMessage(apt)}
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                            Send WhatsApp
                          </Button>
                        )}
                        <div className="text-right hidden sm:block min-w-[72px]">
                          <p className="text-sm font-medium">{format(parseISO(apt.date), "d MMM")}</p>
                          <p className="text-xs text-muted-foreground">{apt.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
