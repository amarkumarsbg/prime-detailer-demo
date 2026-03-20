import { NextResponse } from "next/server";
import {
  getServerAttendanceRecords,
  resetServerAttendanceToSeed,
} from "@/lib/server-attendance";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ records: getServerAttendanceRecords() });
}

export async function DELETE() {
  resetServerAttendanceToSeed();
  return NextResponse.json({ ok: true, records: getServerAttendanceRecords() });
}
