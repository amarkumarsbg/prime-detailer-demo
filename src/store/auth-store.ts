"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Branch } from "@/types";
import { ALL_BRANCHES_BRANCH } from "@/lib/all-branches";

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
  role: "SUPER_ADMIN",
  branchId: "br-001",
  isActive: true,
  attendancePin: "1001",
  emailVerified: true,
};

const mockBranch: Branch = {
  id: "br-001",
  name: "Prime Detailers Koramangala",
  address: "80 Feet Road, Koramangala 4th Block, Bengaluru 560034",
  phone: "+91-80-41234567",
  isActive: true,
  qrCodeId: "qr-br-001",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentBranch: null,
      isAuthenticated: false,

      login: (email: string, _password: string) => {
        if (email) {
          const canOrgWide =
            mockUser.role === "SUPER_ADMIN" ||
            mockUser.role === "ADMIN" ||
            mockUser.role === "MANAGER";
          set({
            user: mockUser,
            currentBranch: canOrgWide ? ALL_BRANCHES_BRANCH : mockBranch,
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
    }),
    {
      name: "prime-detailers-auth",
      partialize: (state) => ({
        user: state.user,
        currentBranch: state.currentBranch,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
