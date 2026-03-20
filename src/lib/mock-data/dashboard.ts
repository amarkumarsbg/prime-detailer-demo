import type { DashboardStats } from "@/types";
import { jobCards } from "./job-cards";

// Today's bookings: active job cards (RECEIVED, INSPECTION, AWAITING_SERVICE)
const todaysBookings = jobCards.filter((jc) =>
  ["RECEIVED", "INSPECTION", "AWAITING_SERVICE"].includes(jc.status)
);

// Ready for delivery: job cards in READY status
const readyForDelivery = jobCards.filter((jc) => jc.status === "READY");

export const dashboardStats: DashboardStats = {
  carsReceivedToday: 3,
  carsDeliveredToday: 2,
  inProgressServices: 12,
  dailyRevenue: 42850,
  totalExpensesToday: 12500,
  netProfitToday: 30350,
  newCustomersToday: 1,
  inactiveCustomers: 3,
  activeJobCards: 12,
  pendingPayments: 4,
  monthlyRevenue: [
    { month: "Apr 2025", revenue: 185000, expenses: 85000, profit: 100000 },
    { month: "May 2025", revenue: 212000, expenses: 95000, profit: 117000 },
    { month: "Jun 2025", revenue: 198500, expenses: 89000, profit: 109500 },
    { month: "Jul 2025", revenue: 235000, expenses: 105000, profit: 130000 },
    { month: "Aug 2025", revenue: 248000, expenses: 112000, profit: 136000 },
    { month: "Sep 2025", revenue: 221000, expenses: 99500, profit: 121500 },
    { month: "Oct 2025", revenue: 265000, expenses: 120000, profit: 145000 },
    { month: "Nov 2025", revenue: 278500, expenses: 125000, profit: 153500 },
    { month: "Dec 2025", revenue: 312000, expenses: 140000, profit: 172000 },
    { month: "Jan 2026", revenue: 285000, expenses: 128000, profit: 157000 },
    { month: "Feb 2026", revenue: 298000, expenses: 134000, profit: 164000 },
    { month: "Mar 2026", revenue: 156000, expenses: 70000, profit: 86000 },
  ],
  serviceBreakdown: [
    { name: "General Service", count: 45 },
    { name: "Engine", count: 12 },
    { name: "Brakes", count: 18 },
    { name: "AC", count: 22 },
    { name: "Electrical", count: 8 },
    { name: "Body", count: 6 },
    { name: "Tires", count: 28 },
  ],
  todaysBookings: todaysBookings.length > 0 ? todaysBookings : [jobCards[0], jobCards[1], jobCards[2]],
  readyForDelivery:
    readyForDelivery.length > 0 ? readyForDelivery : [jobCards.find((jc) => jc.status === "READY")!].filter(Boolean),
};
