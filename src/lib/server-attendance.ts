import { attendanceRecords as seedRecords } from "@/lib/mock-data/attendance";
import { staff as seedStaff } from "@/lib/mock-data/staff";
import { applyPunchToRecords } from "@/lib/attendance-punch-logic";
import type { AttendanceRecord, User, UserRole } from "@/types";

const globalForAttendance = globalThis as unknown as {
  __serverAttendanceRecords?: AttendanceRecord[];
};

function getMutableRecords(): AttendanceRecord[] {
  if (!globalForAttendance.__serverAttendanceRecords) {
    globalForAttendance.__serverAttendanceRecords = [...seedRecords];
  }
  return globalForAttendance.__serverAttendanceRecords;
}

export function getServerAttendanceRecords(): AttendanceRecord[] {
  return [...getMutableRecords()];
}

export function resetServerAttendanceToSeed(): void {
  globalForAttendance.__serverAttendanceRecords = [...seedRecords];
}

export function serverPunch(
  staffId: string,
  branchId: string,
  now = new Date(),
  /** Staff added in-app (not in seed) — client sends name/role after PIN check (demo trust). */
  snapshot?: { name: string; role: UserRole }
) {
  let staffMember: User | undefined = seedStaff.find((s) => s.id === staffId);
  if (!staffMember && snapshot) {
    staffMember = {
      id: staffId,
      name: snapshot.name,
      email: "",
      phone: "",
      role: snapshot.role,
      branchId,
      isActive: true,
    };
  }
  if (!staffMember || !staffMember.isActive) {
    return { ok: false as const, error: "INACTIVE" as const };
  }
  if (staffMember.branchId !== branchId) {
    return { ok: false as const, error: "WRONG_BRANCH" as const };
  }

  const current = getMutableRecords();
  const out = applyPunchToRecords(current, staffMember, branchId, now);
  if (!out.ok) {
    return out;
  }
  globalForAttendance.__serverAttendanceRecords = out.nextRecords;
  return {
    ok: true as const,
    kind: out.kind,
    time: out.time,
    record: out.record,
  };
}
