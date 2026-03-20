import { Redis } from "@upstash/redis";
import { attendanceRecords as seedRecords } from "@/lib/mock-data/attendance";
import { staff as seedStaff } from "@/lib/mock-data/staff";
import { applyPunchToRecords } from "@/lib/attendance-punch-logic";
import type { AttendanceRecord, User, UserRole } from "@/types";

const REDIS_KEY = "attendance:records:v1";

const globalForAttendance = globalThis as unknown as {
  __serverAttendanceRecords?: AttendanceRecord[];
};

let redisSingleton: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisSingleton !== undefined) return redisSingleton;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisSingleton = null;
    return null;
  }
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

function getMutableRecords(): AttendanceRecord[] {
  if (!globalForAttendance.__serverAttendanceRecords) {
    globalForAttendance.__serverAttendanceRecords = [...seedRecords];
  }
  return globalForAttendance.__serverAttendanceRecords;
}

async function readRecords(): Promise<AttendanceRecord[]> {
  const r = getRedis();
  if (!r) {
    return [...getMutableRecords()];
  }
  const raw = await r.get<string>(REDIS_KEY);
  if (raw == null || raw === "") {
    return [...seedRecords];
  }
  try {
    const parsed = JSON.parse(raw) as AttendanceRecord[];
    return Array.isArray(parsed) ? parsed : [...seedRecords];
  } catch {
    return [...seedRecords];
  }
}

async function writeRecords(records: AttendanceRecord[]): Promise<void> {
  const r = getRedis();
  if (!r) {
    globalForAttendance.__serverAttendanceRecords = records;
    return;
  }
  await r.set(REDIS_KEY, JSON.stringify(records));
}

export async function getServerAttendanceRecords(): Promise<AttendanceRecord[]> {
  return readRecords();
}

export async function resetServerAttendanceToSeed(): Promise<void> {
  const next = [...seedRecords];
  await writeRecords(next);
}

export async function serverPunch(
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

  const current = await readRecords();
  const out = applyPunchToRecords(current, staffMember, branchId, now);
  if (!out.ok) {
    return out;
  }
  await writeRecords(out.nextRecords);
  return {
    ok: true as const,
    kind: out.kind,
    time: out.time,
    record: out.record,
  };
}
