"use client";

import { create } from "zustand";
import type { User, Branch } from "@/types";

interface AuthState {
  user: User | null;
  currentBranch: Branch | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setBranch: (branch: Branch) => void;
}

const mockUser: User = {
  id: "USR-001",
  name: "Rajesh Kumar",
  email: "rajesh@primedetailers.in",
  phone: "+91 98765 43210",
  role: "ADMIN",
  branchId: "BR-001",
  isActive: true,
};

const mockBranch: Branch = {
  id: "BR-001",
  name: "Prime Detailers - Koramangala",
  address: "123, 80 Feet Road, Koramangala, Bengaluru - 560034",
  phone: "+91 80 4567 8901",
  isActive: true,
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  currentBranch: null,
  isAuthenticated: false,

  login: (email: string, _password: string) => {
    if (email) {
      set({
        user: mockUser,
        currentBranch: mockBranch,
        isAuthenticated: true,
      });
      return true;
    }
    return false;
  },

  logout: () => {
    set({
      user: null,
      currentBranch: null,
      isAuthenticated: false,
    });
  },

  setBranch: (branch: Branch) => {
    set({ currentBranch: branch });
  },
}));
