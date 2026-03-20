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
  id: "usr-001",
  name: "Rajesh Kumar",
  email: "rajesh@primedetailers.in",
  phone: "+91 98765 43210",
  role: "ADMIN",
  branchId: "br-001",
  isActive: true,
  attendancePin: "1001",
};

const mockBranch: Branch = {
  id: "br-001",
  name: "Prime Detailers Koramangala",
  address: "80 Feet Road, Koramangala 4th Block, Bengaluru 560034",
  phone: "+91-80-41234567",
  isActive: true,
  qrCodeId: "qr-br-001",
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
