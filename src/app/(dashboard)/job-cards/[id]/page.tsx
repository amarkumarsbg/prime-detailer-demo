"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Check, FileText, User, Car, Camera, Upload, X, ImageIcon, Trash2, ChevronLeft, ChevronRight, GripVertical, MessageCircle, ArrowLeftRight, Clock, Lock, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JobCardStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJobCardStore } from "@/store/job-card-store";
import { useStaffStore } from "@/store/staff-store";
import { useHighEndServiceStore } from "@/store/high-end-service-store";
import { useReminderStore } from "@/store/reminder-store";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { JobCard, JobCardStatus, ServiceItem, InspectionPhoto, MechanicSwitchLog } from "@/types";

const WORKFLOW_STATUSES: JobCardStatus[] = [
  "RECEIVED",
  "INSPECTION",
  "AWAITING_SERVICE",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
];

const WORKFLOW_LABELS: Record<JobCardStatus, string> = {
  RECEIVED: "Received",
  INSPECTION: "Inspection",
  AWAITING_SERVICE: "In Service",
  QUALITY_CHECK: "QC",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_LABELS: Record<JobCardStatus, string> = {
  RECEIVED: "Received",
  INSPECTION: "Inspection",
  AWAITING_SERVICE: "Awaiting / In Service",
  QUALITY_CHECK: "Quality Check",
  READY: "Ready",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function JobCardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { jobCards, updateJobCard } = useJobCardStore();
  const staff = useStaffStore((s) => s.staff);

  const jobCard = useMemo(
    () => jobCards.find((jc) => jc.id === id),
    [jobCards, id]
  );

  const mechanics = useMemo(
    () => staff.filter((s) => s.role === "MECHANIC"),
    [staff]
  );
  const { services: highEndServiceConfigs } = useHighEndServiceStore();
  const { generateHighEndReminders } = useReminderStore();

  const [currentStatus, setCurrentStatus] = useState<JobCardStatus>(
    () => jobCard?.status ?? "RECEIVED"
  );
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>(
    () => jobCard?.services ?? []
  );
  const [notes, setNotes] = useState<string>(jobCard?.notes ?? "");
  const [newNote, setNewNote] = useState("");
  const [currentMechanicId, setCurrentMechanicId] = useState<string | undefined>(jobCard?.mechanicId);
  const [currentMechanicName, setCurrentMechanicName] = useState<string | undefined>(jobCard?.mechanicName);
  const [switchLog, setSwitchLog] = useState<MechanicSwitchLog[]>(jobCard?.mechanicSwitchLog ?? []);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [switchToMechanicId, setSwitchToMechanicId] = useState("");
  const [switchReason, setSwitchReason] = useState("");
  const [switchCustomReason, setSwitchCustomReason] = useState("");
  const [qualityCheckDone, setQualityCheckDone] = useState(
    () => jobCard?.qualityCheckCompleted ?? false
  );

  useEffect(() => {
    if (jobCard) {
      setQualityCheckDone(jobCard.qualityCheckCompleted ?? false);
    }
  }, [jobCard?.id, jobCard?.qualityCheckCompleted]);

  const SWITCH_REASONS = [
    "Mechanic on leave",
    "Lunch break",
    "New mechanic assigned",
    "Mechanic overloaded",
    "Skill mismatch",
    "Shift change",
    "Other",
  ];

  const handleSwitchMechanic = () => {
    if (!switchToMechanicId || !switchReason) {
      toast.error("Please select a mechanic and reason");
      return;
    }
    const newMechanic = mechanics.find((m) => m.id === switchToMechanicId);
    if (!newMechanic) return;

    const reason = switchReason === "Other" ? switchCustomReason || "Other" : switchReason;

    const logEntry: MechanicSwitchLog = {
      fromMechanicId: currentMechanicId ?? "—",
      fromMechanicName: currentMechanicName ?? "Unassigned",
      toMechanicId: newMechanic.id,
      toMechanicName: newMechanic.name,
      reason,
      switchedAt: new Date().toISOString(),
      switchedBy: "USR-001",
    };

    const updatedLog = [...switchLog, logEntry];
    setSwitchLog(updatedLog);
    setCurrentMechanicId(newMechanic.id);
    setCurrentMechanicName(newMechanic.name);

    updateJobCard(id, {
      mechanicId: newMechanic.id,
      mechanicName: newMechanic.name,
      mechanicSwitchLog: updatedLog,
      updatedAt: new Date().toISOString(),
    });

    setShowSwitchDialog(false);
    setSwitchToMechanicId("");
    setSwitchReason("");
    setSwitchCustomReason("");

    toast.success("Mechanic switched", {
      description: `${currentMechanicName ?? "Unassigned"} → ${newMechanic.name}`,
    });
  };

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    if (totalMinutes < 1) return "< 1 min";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const mechanicTimeline = useMemo(() => {
    const timeline: {
      name: string;
      from: string;
      to: string | null;
      duration: number;
      isActive: boolean;
      reason?: string;
    }[] = [];

    const createdAt = jobCard?.createdAt ?? new Date().toISOString();
    const initialMechanic = jobCard?.mechanicName;

    if (switchLog.length === 0 && currentMechanicName) {
      const from = createdAt;
      const now = Date.now();
      timeline.push({
        name: currentMechanicName,
        from,
        to: null,
        duration: now - new Date(from).getTime(),
        isActive: true,
      });
    } else if (switchLog.length > 0) {
      const firstSwitch = switchLog[0];
      const firstFrom = createdAt;
      const firstTo = firstSwitch.switchedAt;
      timeline.push({
        name: firstSwitch.fromMechanicName,
        from: firstFrom,
        to: firstTo,
        duration: new Date(firstTo).getTime() - new Date(firstFrom).getTime(),
        isActive: false,
        reason: firstSwitch.reason,
      });

      for (let i = 0; i < switchLog.length; i++) {
        const entry = switchLog[i];
        const from = entry.switchedAt;
        const to = i + 1 < switchLog.length ? switchLog[i + 1].switchedAt : null;
        const isActive = to === null;
        const duration = to
          ? new Date(to).getTime() - new Date(from).getTime()
          : Date.now() - new Date(from).getTime();

        timeline.push({
          name: entry.toMechanicName,
          from,
          to,
          duration,
          isActive,
          reason: !isActive && i + 1 < switchLog.length ? switchLog[i + 1].reason : undefined,
        });
      }
    }

    return timeline;
  }, [jobCard?.createdAt, jobCard?.mechanicName, switchLog, currentMechanicName]);

  const totalWorkDuration = useMemo(
    () => mechanicTimeline.reduce((sum, t) => sum + t.duration, 0),
    [mechanicTimeline]
  );

  const displayPhotos = useMemo(() => {
    const photos = jobCard?.inspectionPhotos ?? [];
    const placeholder = "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=300&fit=crop";
    if (photos.length > 0) {
      return photos.map((p: InspectionPhoto) => ({
        id: p.id,
        url: p.url.startsWith("http") ? p.url : placeholder,
        type: p.type,
        label: p.caption ?? "Photo",
      }));
    }
    return [];
  }, [jobCard?.inspectionPhotos, jobCard?.id]);

  const [inspectionPhotos, setInspectionPhotos] = useState<
    { id: string; url: string; type: "BEFORE" | "AFTER"; label: string }[]
  >([]);

  const photosToShow = displayPhotos.length > 0 ? displayPhotos : inspectionPhotos;

  const hasBeforePhoto = useMemo(
    () => photosToShow.some((p) => p.type === "BEFORE"),
    [photosToShow]
  );
  const hasAfterPhoto = useMemo(
    () => photosToShow.some((p) => p.type === "AFTER"),
    [photosToShow]
  );

  /** Before photos: only while job is before QC (inspection / in service). */
  const canUploadBefore = ["RECEIVED", "INSPECTION", "AWAITING_SERVICE"].includes(currentStatus);
  /** After photos: only after QC is marked complete, or once past QC. */
  const canUploadAfter =
    (currentStatus === "QUALITY_CHECK" && qualityCheckDone) ||
    currentStatus === "READY" ||
    currentStatus === "DELIVERED";
  const canCompare = hasBeforePhoto && hasAfterPhoto;

  const [photoTab, setPhotoTab] = useState<"BEFORE" | "AFTER" | "COMPARE">(() => {
    if (jobCard?.status === "READY" || jobCard?.status === "DELIVERED") return "AFTER";
    return "BEFORE";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (photoTab === "AFTER" && !canUploadAfter) setPhotoTab("BEFORE");
  }, [photoTab, canUploadAfter]);

  useEffect(() => {
    if (photoTab === "COMPARE" && !canCompare) setPhotoTab("BEFORE");
  }, [photoTab, canCompare]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || displayPhotos.length > 0) return;
    if (photoTab === "COMPARE") return;
    if (photoTab === "BEFORE" && !canUploadBefore) {
      toast.error("Before photos can only be uploaded during inspection / in service");
      return;
    }
    if (photoTab === "AFTER" && !canUploadAfter) {
      toast.error("Mark quality check complete first, then upload After photos");
      return;
    }

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setInspectionPhotos((prev) => [
        ...prev,
        {
          id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url,
          type: photoTab,
          label: name,
        },
      ]);
    });

    toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} added`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const handleRemovePhoto = (photoId: string) => {
    if (displayPhotos.length > 0) return;
    setInspectionPhotos((prev) => prev.filter((p) => p.id !== photoId));
    if (viewingPhoto === photoId) setViewingPhoto(null);
  };

  const viewingPhotoData = viewingPhoto ? photosToShow.find((p) => p.id === viewingPhoto) : null;
  const filteredPhotos = photosToShow.filter((p) => p.type === photoTab);
  const viewingIndex = viewingPhoto ? filteredPhotos.findIndex((p) => p.id === viewingPhoto) : -1;

  const navigatePhoto = (dir: -1 | 1) => {
    const nextIdx = viewingIndex + dir;
    if (nextIdx >= 0 && nextIdx < filteredPhotos.length) {
      setViewingPhoto(filteredPhotos[nextIdx].id);
    }
  };

  const [dragId, setDragId] = useState<string | null>(null);

  const handleDragStart = (photoId: string) => {
    setDragId(photoId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId || displayPhotos.length > 0) return;

    setInspectionPhotos((prev) => {
      const items = [...prev];
      const dragIdx = items.findIndex((p) => p.id === dragId);
      const targetIdx = items.findIndex((p) => p.id === targetId);
      if (dragIdx === -1 || targetIdx === -1) return prev;
      const [dragged] = items.splice(dragIdx, 1);
      items.splice(targetIdx, 0, dragged);
      return items;
    });
  };

  const handleDragEnd = () => {
    setDragId(null);
  };

  const currentStatusIndex = useMemo(() => {
    if (currentStatus === "CANCELLED") return -1;
    return WORKFLOW_STATUSES.indexOf(currentStatus);
  }, [currentStatus]);

  const completedCount = serviceItems.filter((s) => s.isCompleted).length;
  const totalCount = serviceItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleServiceComplete = (serviceId: string) => {
    setServiceItems((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, isCompleted: !s.isCompleted } : s
      )
    );
  };

  const handleQualityCheckChange = (checked: boolean) => {
    setQualityCheckDone(checked);
    if (jobCard) {
      updateJobCard(jobCard.id, {
        qualityCheckCompleted: checked,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const addNote = () => {
    if (newNote.trim()) {
      setNotes((prev) => prev + (prev ? "\n\n" : "") + newNote.trim());
      setNewNote("");
    }
  };

  const handleUpdateStatus = () => {
    if (!jobCard || currentStatus === "DELIVERED" || currentStatus === "CANCELLED") return;
    const nextIndex = currentStatusIndex + 1;
    if (nextIndex < WORKFLOW_STATUSES.length) {
      const nextStatus = WORKFLOW_STATUSES[nextIndex];

      if (currentStatus === "INSPECTION" && nextStatus === "AWAITING_SERVICE") {
        if (!hasBeforePhoto) {
          toast.error("Upload at least one Before photo before continuing");
          return;
        }
      }

      if (currentStatus === "AWAITING_SERVICE" && nextStatus === "QUALITY_CHECK") {
        if (totalCount > 0 && completedCount !== totalCount) {
          toast.error("Complete all service checklist items before Quality Check");
          return;
        }
      }

      if (currentStatus === "QUALITY_CHECK" && nextStatus === "READY") {
        if (!qualityCheckDone) {
          toast.error("Mark quality check as complete first");
          return;
        }
        if (!hasAfterPhoto) {
          toast.error("Upload at least one After photo before moving to Ready");
          return;
        }
      }

      setCurrentStatus(nextStatus);

      if (nextStatus === "DELIVERED" && jobCard.highEndServiceIds && jobCard.highEndServiceIds.length > 0) {
        const now = new Date().toISOString();
        jobCard.highEndServiceIds.forEach((hesId) => {
          const config = highEndServiceConfigs.find((c) => c.id === hesId);
          if (config) {
            generateHighEndReminders({
              jobCardId: jobCard.id,
              serviceName: config.name,
              serviceDate: now,
              customerId: jobCard.customerId,
              customerName: jobCard.customerName,
              customerPhone: jobCard.customerPhone,
              vehicleId: jobCard.vehicleId,
              vehicleRegNumber: jobCard.vehicleRegNumber,
              vehicleMakeModel: jobCard.vehicleMakeModel,
              intervalMonths: config.reminderIntervals,
            });
          }
        });
        toast.success("Maintenance reminders created", {
          description: `Auto-generated reminders for ${jobCard.highEndServiceIds.length} high-end service(s)`,
        });
      }

      updateJobCard(jobCard.id, { status: nextStatus, updatedAt: new Date().toISOString() });

      toast.success("Status updated", {
        description: `Job card moved to "${STATUS_LABELS[nextStatus]}"`,
      });
    }
  };

  const handleCancel = () => {
    if (!jobCard || currentStatus === "DELIVERED") return;
    setCurrentStatus("CANCELLED");
    toast.error("Job card cancelled", {
      description: `${jobCard.jobNumber} has been cancelled.`,
    });
  };

  const handleWhatsAppNotify = () => {
    toast.success("WhatsApp notification sent", {
      description: `Simulated notification to ${jobCard?.customerPhone}`,
    });
  };

  if (!jobCard) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Job Card Not Found"
          actions={
            <Link href="/job-cards">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Job Cards
              </Button>
            </Link>
          }
        />
        <p className="text-muted-foreground">The requested job card could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 md:pb-0">
      <Breadcrumbs items={[
        { label: "Job Cards", href: "/job-cards" },
        { label: jobCard.jobNumber },
      ]} />

      {/* Workflow Progress Bar — scroll horizontally on narrow screens */}
      {currentStatus !== "CANCELLED" && (
        <Card>
          <CardContent className="!pt-6 !pb-5 !px-4 sm:!pt-8 sm:!pb-6 sm:!px-10">
            <p className="text-xs text-muted-foreground mb-3 sm:hidden">Swipe steps to see full workflow</p>
            <div className="overflow-x-auto overflow-y-visible -mx-1 px-1 pb-2 sm:mx-0 sm:px-0 sm:pb-0 touch-pan-x [scrollbar-width:thin]">
              <div className="flex items-center min-w-max sm:min-w-0 sm:w-full sm:justify-center gap-0">
                {WORKFLOW_STATUSES.map((status, index) => {
                  const isCompleted = index < currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const isLast = index === WORKFLOW_STATUSES.length - 1;

                  return (
                    <div key={status} className="flex items-center shrink-0">
                      <div className="flex flex-col items-center w-[4.5rem] sm:w-24 px-0.5">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isCompleted
                              ? "bg-primary border-primary text-primary-foreground"
                              : isCurrent
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                          ) : (
                            <span className="text-[11px] sm:text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs mt-1.5 text-center leading-snug max-w-[4.5rem] sm:max-w-none ${
                            isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {WORKFLOW_LABELS[status]}
                        </span>
                      </div>
                      {!isLast && (
                        <div
                          className={`h-0.5 w-6 sm:flex-1 sm:min-w-[0.5rem] sm:max-w-20 shrink-0 ${
                            isCompleted ? "bg-primary" : "bg-muted"
                          }`}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-start gap-2 sm:gap-3 mt-5">
              <Button
                className="w-full sm:w-auto"
                onClick={handleUpdateStatus}
                disabled={
                  currentStatus === "DELIVERED" ||
                  currentStatusIndex >= WORKFLOW_STATUSES.length - 1
                }
              >
                Update Status
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="destructive"
                onClick={handleCancel}
                disabled={currentStatus === "DELIVERED"}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <div className="h-1.5 bg-linear-to-r from-primary via-primary/80 to-primary/50" aria-hidden />
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 min-w-0">
              <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground hover:text-foreground" asChild>
                <Link href="/job-cards">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  All job cards
                </Link>
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job card</p>
                <h1 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mt-0.5">
                  {jobCard.jobNumber}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <JobCardStatusBadge status={currentStatus} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm lg:max-w-2xl lg:shrink-0">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</p>
                <p className="font-semibold mt-1">{formatDate(jobCard.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expected delivery</p>
                <p className="font-semibold mt-1">{formatDate(jobCard.expectedDelivery)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mechanic</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="font-semibold">{currentMechanicName ?? "—"}</p>
                  {currentStatus !== "DELIVERED" && currentStatus !== "CANCELLED" && (
                    <button
                      type="button"
                      onClick={() => setShowSwitchDialog(true)}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Switch mechanic"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estimate</p>
                <p className="font-semibold mt-1 tabular-nums">{formatCurrency(jobCard.estimatedAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Incentive</p>
                <p className="font-semibold mt-1 tabular-nums">
                  {jobCard.incentivePercent}% ({formatCurrency(jobCard.incentiveAmount)})
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Segment</p>
                <p className="font-semibold mt-1">{jobCard.vehicleSegment.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-semibold">{jobCard.customerName}</p>
            <p className="text-sm text-muted-foreground mt-1">{jobCard.customerPhone}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
            <CardTitle className="text-base">Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="font-semibold font-mono tracking-wide">{jobCard.vehicleRegNumber}</p>
            <p className="text-sm text-muted-foreground mt-1">{jobCard.vehicleMakeModel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Checklist Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Checklist</CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <Progress value={progressPercent} className="w-32 h-2" />
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {serviceItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={item.isCompleted}
                    onCheckedChange={() => toggleServiceComplete(item.id)}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        item.isCompleted ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(item.price)}
                    </p>
                  </div>
                </div>
                {item.isCompleted && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Done
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentStatus === "QUALITY_CHECK" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Check</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Mark QC complete to unlock After photos. You need at least one After photo before moving to Ready.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <Checkbox
                id="qc-complete"
                checked={qualityCheckDone}
                onCheckedChange={(v) => handleQualityCheckChange(v === true)}
              />
              <label htmlFor="qc-complete" className="text-sm leading-tight cursor-pointer select-none">
                <span className="font-medium">Quality check completed</span>
                <p className="text-muted-foreground mt-1 text-xs">
                  Confirm the work meets standards. After photos stay locked until this is checked.
                </p>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspection Photos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Inspection Photos
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPhotoTab("BEFORE")}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 hover:bg-muted ${
                    photoTab === "BEFORE" ? "bg-primary text-primary-foreground hover:bg-primary!" : ""
                  }`}
                >
                  Before
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoTab("AFTER")}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    photoTab === "AFTER"
                      ? "bg-primary text-primary-foreground"
                      : canUploadAfter
                      ? "hover:bg-muted"
                      : "opacity-70"
                  }`}
                >
                  {!canUploadAfter && <Lock className="w-2.5 h-2.5" />}
                  After
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoTab("COMPARE")}
                  className={`px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                    photoTab === "COMPARE"
                      ? "bg-primary text-primary-foreground"
                      : canCompare
                      ? "hover:bg-muted"
                      : "opacity-70"
                  }`}
                >
                  {!canCompare && <Lock className="w-2.5 h-2.5" />}
                  Compare
                </button>
              </div>
            </div>
          </div>
          {/* Status hint */}
          <div className="mt-2 space-y-1">
            {["RECEIVED", "INSPECTION", "AWAITING_SERVICE"].includes(currentStatus) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Camera className="w-3 h-3 shrink-0" />
                Upload at least one &quot;Before&quot; photo before leaving Inspection. &quot;After&quot; photos unlock after QC is completed.
              </p>
            )}
            {currentStatus === "AWAITING_SERVICE" && totalCount > 0 && completedCount < totalCount && (
              <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Complete the service checklist before moving to Quality Check.
              </p>
            )}
            {currentStatus === "QUALITY_CHECK" && !qualityCheckDone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lock className="w-3 h-3 shrink-0" />
                Complete the Quality Check above to unlock &quot;After&quot; photos.
              </p>
            )}
            {currentStatus === "QUALITY_CHECK" && qualityCheckDone && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <Check className="w-3 h-3 shrink-0" />
                Quality check done — you can now upload &quot;After&quot; photos. Upload at least one before moving to Ready.
              </p>
            )}
            {(currentStatus === "READY" || currentStatus === "DELIVERED") && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Check className="w-3 h-3 shrink-0" />
                Both before &amp; after photos are available. Use Compare to view side by side.
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Locked state for After / Compare when status is too early */}
          {photoTab === "AFTER" && !canUploadAfter ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Lock className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">After photos are locked</p>
              <p className="text-xs mt-1 text-center max-w-sm px-2">
                {currentStatus === "QUALITY_CHECK"
                  ? "Mark Quality check completed above first. After photos unlock once QC is done."
                  : "Move past In Service to Quality Check, then complete QC to upload After photos."}
              </p>
            </div>
          ) : photoTab === "COMPARE" && !canCompare ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Lock className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Compare view is locked</p>
              <p className="text-xs mt-1">Upload both before and after photos to compare</p>
            </div>
          ) : photoTab === "COMPARE" ? (
            <CompareView photos={photosToShow} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    draggable={displayPhotos.length === 0}
                    onDragStart={displayPhotos.length === 0 ? () => handleDragStart(photo.id) : undefined}
                    onDragOver={displayPhotos.length === 0 ? (e) => handleDragOver(e, photo.id) : undefined}
                    onDragEnd={handleDragEnd}
                    className={`rounded-xl border border-border overflow-hidden bg-card transition-all ${dragId === photo.id ? "opacity-50 scale-95 ring-2 ring-primary" : "hover:shadow-lg"}`}
                  >
                    <div className="relative">
                      <img src={photo.url} alt={photo.label} className="w-full aspect-4/3 object-cover" />
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                      <button
                        onClick={() => setViewingPhoto(photo.id)}
                        className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        Preview
                      </button>
                      {displayPhotos.length === 0 && (
                        <button
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="text-sm font-semibold text-destructive hover:text-destructive/80 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {displayPhotos.length === 0 &&
                  ((photoTab === "BEFORE" && canUploadBefore) ||
                    (photoTab === "AFTER" && canUploadAfter)) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border min-h-[220px] hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                    >
                      <Upload className="w-7 h-7 mb-2" />
                      <span className="text-sm font-medium">
                        Upload {photoTab === "BEFORE" ? "Before" : "After"} Photo
                      </span>
                    </button>
                  )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              {filteredPhotos.length === 0 &&
                !(
                  displayPhotos.length === 0 &&
                  ((photoTab === "BEFORE" && canUploadBefore) ||
                    (photoTab === "AFTER" && canUploadAfter))
                ) && (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">No {photoTab.toLowerCase()} photos yet</p>
                    {photoTab === "BEFORE" && !canUploadBefore && (
                      <p className="text-xs mt-2 text-center max-w-sm">
                        Before uploads are only allowed during inspection / in service.
                      </p>
                    )}
                    {photoTab === "AFTER" && !canUploadAfter && (
                      <p className="text-xs mt-2 text-center max-w-sm">
                        Complete Quality Check first to add After photos.
                      </p>
                    )}
                  </div>
                )}
            </>
          )}

          {viewingPhotoData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setViewingPhoto(null)}>
              <button onClick={() => setViewingPhoto(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {viewingIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhoto(-1); }}
                  className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <div className="max-w-3xl max-h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
                <img src={viewingPhotoData.url} alt={viewingPhotoData.label} className="w-full h-full object-contain rounded-lg" />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-white text-sm font-medium">{viewingPhotoData.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-xs">{viewingIndex + 1} / {filteredPhotos.length}</span>
                    <button
                      onClick={() => handleRemovePhoto(viewingPhotoData.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 text-white text-xs font-medium hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {viewingIndex < filteredPhotos.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigatePhoto(1); }}
                  className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
              {notes}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button onClick={addNote} variant="secondary" className="shrink-0 sm:self-end">
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mechanic Assignment & Time Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Mechanic Assignment
            </CardTitle>
            <div className="flex items-center gap-2">
              {mechanicTimeline.length > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Total: {formatDuration(totalWorkDuration)}
                </div>
              )}
              {currentStatus !== "DELIVERED" && currentStatus !== "CANCELLED" && (
                <Button variant="outline" size="sm" onClick={() => setShowSwitchDialog(true)}>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" />
                  Switch Mechanic
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Mechanic */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {currentMechanicName ? currentMechanicName.split(" ").map((n) => n[0]).join("") : "?"}
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentMechanicName ?? "No mechanic assigned"}</p>
              <p className="text-xs text-muted-foreground">
                {currentMechanicName ? "Currently assigned" : "Assign a mechanic to this job card"}
              </p>
            </div>
            {mechanicTimeline.find((t) => t.isActive) && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Working since</p>
                <p className="text-sm font-medium">
                  {new Date(mechanicTimeline.find((t) => t.isActive)!.from).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {formatDuration(mechanicTimeline.find((t) => t.isActive)!.duration)}
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          {mechanicTimeline.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Work Timeline</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Mechanic</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">From</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">To</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Duration</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mechanicTimeline.map((entry, idx) => (
                      <tr key={idx} className={`border-b last:border-b-0 ${entry.isActive ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-semibold shrink-0">
                              {entry.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="font-medium">{entry.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          <div>
                            <p>{new Date(entry.from).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                            <p className="text-xs">{new Date(entry.from).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {entry.to ? (
                            <div>
                              <p>{new Date(entry.to).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</p>
                              <p className="text-xs">{new Date(entry.to).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          ) : (
                            <span className="text-green-600 dark:text-green-400 font-medium">Ongoing</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium">
                          {formatDuration(entry.duration)}
                        </td>
                        <td className="px-3 py-2.5">
                          {entry.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                              {entry.reason ?? "Switched"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Switch Mechanic Dialog */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Mechanic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">Current Mechanic</p>
              <p className="font-medium mt-0.5">{currentMechanicName ?? "Unassigned"}</p>
            </div>

            <div className="space-y-2">
              <Label>New Mechanic *</Label>
              <Select value={switchToMechanicId} onValueChange={setSwitchToMechanicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mechanic" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics
                    .filter((m) => m.id !== currentMechanicId)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={switchReason} onValueChange={setSwitchReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {SWITCH_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {switchReason === "Other" && (
              <div className="space-y-2">
                <Label>Specify Reason</Label>
                <Input
                  placeholder="Enter reason..."
                  value={switchCustomReason}
                  onChange={(e) => setSwitchCustomReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowSwitchDialog(false)}>Cancel</Button>
              <Button onClick={handleSwitchMechanic}>Confirm Switch</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms & Conditions */}
      {jobCard.termsAndConditions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
              {jobCard.termsAndConditions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleWhatsAppNotify}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Send WhatsApp Notification
          </Button>
          {jobCard.quotationId && (
            <Link href={`/billing?quotationId=${jobCard.quotationId}`}>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                View Quotation
              </Button>
            </Link>
          )}
          <Link href={`/billing?jobCardId=${jobCard.id}`}>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </Link>
          <Link href={`/customers/${jobCard.customerId}`}>
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              View Customer
            </Button>
          </Link>
          <Link href={`/vehicles/${jobCard.vehicleId}`}>
            <Button variant="outline">
              <Car className="w-4 h-4 mr-2" />
              View Vehicle
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function CompareView({ photos }: { photos: { id: string; url: string; type: "BEFORE" | "AFTER"; label: string }[] }) {
  const beforePhotos = photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = photos.filter((p) => p.type === "AFTER");
  const maxLen = Math.max(beforePhotos.length, afterPhotos.length);

  if (beforePhotos.length === 0 && afterPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">No photos to compare</p>
        <p className="text-xs mt-1">Upload Before and After photos first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Before
          </span>
        </div>
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            After
          </span>
        </div>
      </div>
      {Array.from({ length: maxLen }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
            {beforePhotos[i] ? (
              <div>
                <img src={beforePhotos[i].url} alt={beforePhotos[i].label} className="w-full aspect-4/3 object-cover" />
                <p className="text-xs font-medium text-center py-2 border-t border-border">{beforePhotos[i].label}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-4/3 text-muted-foreground">
                <p className="text-xs">No photo</p>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
            {afterPhotos[i] ? (
              <div>
                <img src={afterPhotos[i].url} alt={afterPhotos[i].label} className="w-full aspect-4/3 object-cover" />
                <p className="text-xs font-medium text-center py-2 border-t border-border">{afterPhotos[i].label}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-4/3 text-muted-foreground">
                <p className="text-xs">No photo</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
