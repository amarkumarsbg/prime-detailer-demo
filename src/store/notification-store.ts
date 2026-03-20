"use client";

import { create } from "zustand";

export type NotificationType =
  | "job_created"
  | "job_status"
  | "job_completed"
  | "payment_received"
  | "customer_new"
  | "vehicle_added"
  | "reminder"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  href?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  unreadCount: () => number;
}

const now = new Date();
const mins = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
const hours = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();

const mockNotifications: Notification[] = [
  {
    id: "n-001",
    type: "job_status",
    title: "Job Card Updated",
    message: "JC-2026-0004 moved to Inspection stage. Assigned to Murugan P.",
    read: false,
    href: "/job-cards/jc-004",
    createdAt: mins(3),
  },
  {
    id: "n-002",
    type: "payment_received",
    title: "Payment Received",
    message: "₹4,500 received from Arun Mehta via UPI for INV-2026-0012.",
    read: false,
    href: "/billing/inv-006",
    createdAt: mins(12),
  },
  {
    id: "n-003",
    type: "job_created",
    title: "New Job Card",
    message: "JC-2026-0010 created for Deepa Nambiar — Mahindra XUV700.",
    read: false,
    href: "/job-cards/jc-002",
    createdAt: mins(28),
  },
  {
    id: "n-004",
    type: "customer_new",
    title: "New Customer Registered",
    message: "Priya Sharma registered with referral code REF-AX7K.",
    read: false,
    href: "/customers/cust-001",
    createdAt: hours(1),
  },
  {
    id: "n-005",
    type: "job_completed",
    title: "Service Completed",
    message: "JC-2026-0008 — all services completed. Ready for quality check.",
    read: true,
    href: "/job-cards/jc-008",
    createdAt: hours(2),
  },
  {
    id: "n-006",
    type: "reminder",
    title: "Delivery Reminder",
    message: "JC-2026-0001 is due for delivery today. Customer: Arun Mehta.",
    read: true,
    href: "/job-cards/jc-001",
    createdAt: hours(3),
  },
  {
    id: "n-007",
    type: "vehicle_added",
    title: "Vehicle Registered",
    message: "KA-03-QR-4567 (Tata Harrier) added for Vijay Bhaskar.",
    read: true,
    href: "/vehicles/veh-006",
    createdAt: hours(4),
  },
  {
    id: "n-008",
    type: "payment_received",
    title: "Payment Received",
    message: "₹12,300 received from Ganesh Prasad via Card for INV-2026-0009.",
    read: true,
    href: "/billing/inv-003",
    createdAt: hours(5),
  },
  {
    id: "n-009",
    type: "system",
    title: "System Update",
    message: "Prime Detailers v1.1 is now available with new billing features.",
    read: true,
    createdAt: hours(8),
  },
  {
    id: "n-010",
    type: "job_status",
    title: "Job Card Updated",
    message: "JC-2026-0006 moved to Awaiting Approval. Pending customer confirmation.",
    read: true,
    href: "/job-cards/jc-006",
    createdAt: hours(10),
  },
];

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: mockNotifications,

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  dismiss: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
