import { NextResponse } from "next/server";
import {
  getServerAttendanceRecords,
  serverPunch,
} from "@/lib/server-attendance";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

const ROLES: UserRole[] = ["ADMIN", "MANAGER", "RECEPTIONIST", "MECHANIC"];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      staffId?: string;
      branchId?: string;
      staffName?: string;
      staffRole?: UserRole;
    };
    const { staffId, branchId, staffName, staffRole } = body;
    if (!staffId || !branchId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const snapshot =
      staffName && staffRole && ROLES.includes(staffRole)
        ? { name: staffName, role: staffRole }
        : undefined;

    const result = serverPunch(staffId, branchId, new Date(), snapshot);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error });
    }

    return NextResponse.json({
      ok: true,
      kind: result.kind,
      time: result.time,
      record: result.record,
      records: getServerAttendanceRecords(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    );
  }
}
