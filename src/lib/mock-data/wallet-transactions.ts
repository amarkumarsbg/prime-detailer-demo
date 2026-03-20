import type { WalletTransaction } from "@/types";

export const walletTransactions: WalletTransaction[] = [
  {
    id: "wt-001",
    customerId: "cust-001",
    customerName: "Arun Mehta",
    type: "CREDIT",
    amount: 500,
    source: "REFERRAL_REWARD",
    description: "Referral reward for new customer",
    balanceAfter: 1500,
    createdAt: "2026-03-10T16:00:00Z",
  },
];
