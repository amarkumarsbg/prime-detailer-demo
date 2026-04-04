"use client";

import { useSyncExternalStore } from "react";
import { useJobCardStore } from "@/store/job-card-store";
import { useBranchStore } from "@/store/branch-store";
import { useCustomerStore } from "@/store/customer-store";
import { useInventoryStore } from "@/store/inventory-store";

const persistApis = [
  useJobCardStore.persist,
  useBranchStore.persist,
  useCustomerStore.persist,
  useInventoryStore.persist,
] as const;

function allHydrated(): boolean {
  return persistApis.every((p) => p.hasHydrated());
}

function subscribe(onStoreChange: () => void): () => void {
  const unsubs = persistApis.map((p) => p.onFinishHydration(onStoreChange));
  return () => {
    unsubs.forEach((u) => u());
  };
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Dashboard reads several persisted Zustand stores. Until they finish rehydrating
 * from storage, metrics and lists can flash empty — show a skeleton instead.
 */
export function useDashboardStoresReady(): boolean {
  return useSyncExternalStore(subscribe, allHydrated, getServerSnapshot);
}
