"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { branches } from "@/lib/mock-data";
import { useStaffStore } from "@/store/staff-store";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Shield, UserCog, Headset, WrenchIcon, ClipboardList, IndianRupee } from "lucide-react";
import type { User, UserRole } from "@/types";
import { toast } from "sonner";

const ROLE_BADGE_MAP: Record<UserRole, { label: string; className: string; icon: React.ElementType }> = {
  ADMIN: { label: "Admin", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: Shield },
  MANAGER: { label: "Manager", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: UserCog },
  RECEPTIONIST: { label: "Receptionist", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Headset },
  MECHANIC: { label: "Mechanic", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: WrenchIcon },
};

const defaultBranchId = branches[0]?.id ?? "br-001";

export default function StaffPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const staff = useStaffStore((s) => s.staff);
  const addStaff = useStaffStore((s) => s.addStaff);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("MECHANIC");
  const [newBranchId, setNewBranchId] = useState(defaultBranchId);

  const resetAddForm = () => {
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("MECHANIC");
    setNewBranchId(defaultBranchId);
  };

  const columns = useMemo(
    () => [
    {
      key: "name",
      label: "Name",
      render: (item: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(item.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (item: User) => {
        const badge = ROLE_BADGE_MAP[item.role];
        const Icon = badge.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
            <Icon className="w-3 h-3" />
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "branchId",
      label: "Branch",
      render: (item: User) => {
        const branch = branches.find((b) => b.id === item.branchId);
        return <span className="text-sm">{branch?.name ?? "—"}</span>;
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (item: User) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${item.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
          {item.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    ...(staff.some((s) => s.totalJobsCompleted != null || s.totalIncentiveEarned != null)
      ? [
          {
            key: "totalJobsCompleted",
            label: "Jobs Completed",
            render: (item: User) =>
              item.totalJobsCompleted != null ? (
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                  {item.totalJobsCompleted}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
          {
            key: "totalIncentiveEarned",
            label: "Incentive Earned",
            render: (item: User) =>
              item.totalIncentiveEarned != null ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {item.totalIncentiveEarned.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
        ]
      : []),
    ],
    [staff]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newName.trim();
    const email = newEmail.trim();
    const phone = newPhone.trim();
    if (!name || !email || !phone) {
      toast.error("Please fill in name, email, and phone.");
      return;
    }
    const dup = staff.some(
      (s) => s.email.toLowerCase() === email.toLowerCase()
    );
    if (dup) {
      toast.error("A staff member with this email already exists.");
      return;
    }
    addStaff({
      name,
      email,
      phone,
      role: newRole,
      branchId: newBranchId,
    });
    toast.success("Staff member added successfully");
    resetAddForm();
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Staff Management"
        description="Manage your team members and their roles"
        actions={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetAddForm();
            }}
          >
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Add Staff</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>Add a new team member to your team.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@primedetailers.in"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+91-9876543210"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      required
                      value={newRole}
                      onValueChange={(v) => setNewRole(v as UserRole)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                        <SelectItem value="MECHANIC">Mechanic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select
                      required
                      value={newBranchId}
                      onValueChange={setNewBranchId}
                    >
                      <SelectTrigger id="branch">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Add Staff</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable
        data={staff}
        columns={columns}
        searchPlaceholder="Search staff..."
        searchKeys={["name", "email", "phone", "role"]}
        onRowClick={(item) => router.push(`/staff/${item.id}`)}
      />
    </div>
  );
}
