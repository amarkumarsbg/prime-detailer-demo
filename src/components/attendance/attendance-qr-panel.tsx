"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";
import { branches } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "lucide-react";

const PUNCH_QR_ORIGIN_KEY = "prime-detailers-punch-qr-origin";

function buildPunchUrl(origin: string, branchId: string, qr?: string): string {
  const u = new URL("/attendance/punch", origin);
  u.searchParams.set("branchId", branchId);
  if (qr) u.searchParams.set("qr", qr);
  return u.toString();
}

/** Accepts `http://192.168.1.5:3000` or `192.168.1.5:3000` */
function normalizeOrigin(input: string): string {
  const s = input.trim();
  if (!s) return "";
  try {
    const u = new URL(s.includes("://") ? s : `http://${s}`);
    return u.origin;
  } catch {
    return "";
  }
}

function useWindowOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => ""
  );
}

function isLocalhostOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const h = new URL(origin).hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

type AttendanceQrPanelProps = {
  defaultBranchId: string;
};

export function AttendanceQrPanel({ defaultBranchId }: AttendanceQrPanelProps) {
  const [branchId, setBranchId] = useState(defaultBranchId);
  const windowOrigin = useWindowOrigin();
  const [originOverride, setOriginOverride] = useState("");

  useEffect(() => {
    try {
      setOriginOverride(localStorage.getItem(PUNCH_QR_ORIGIN_KEY) ?? "");
    } catch {
      setOriginOverride("");
    }
  }, []);

  const envOrigin =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
      : "";

  /** Set in .env.local while testing on phone: http://192.168.x.x:3000 */
  const devLanOrigin =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEV_LAN_ORIGIN
      ? normalizeOrigin(process.env.NEXT_PUBLIC_DEV_LAN_ORIGIN)
      : "";

  const effectiveOrigin = useMemo(() => {
    const fromInput = normalizeOrigin(originOverride);
    if (fromInput) return fromInput;
    if (envOrigin) return envOrigin;
    // Opening the CRM at localhost makes a bad QR for phones; prefer LAN URL if set
    if (devLanOrigin && (windowOrigin === "" || isLocalhostOrigin(windowOrigin))) {
      return devLanOrigin;
    }
    return windowOrigin;
  }, [originOverride, envOrigin, devLanOrigin, windowOrigin]);

  const branch = useMemo(
    () => branches.find((b) => b.id === branchId),
    [branchId]
  );

  const punchUrl = useMemo(() => {
    if (!effectiveOrigin || !branch) return "";
    return buildPunchUrl(effectiveOrigin, branch.id, branch.qrCodeId);
  }, [effectiveOrigin, branch]);

  const persistOriginOverride = (value: string) => {
    setOriginOverride(value);
    try {
      if (value.trim()) {
        localStorage.setItem(PUNCH_QR_ORIGIN_KEY, value.trim());
      } else {
        localStorage.removeItem(PUNCH_QR_ORIGIN_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          Store QR (PIN punch)
        </CardTitle>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-2">
          <Label htmlFor="punch-qr-origin" className="text-xs text-muted-foreground">
            Link base URL (for phone scanning)
          </Label>
          <Input
            id="punch-qr-origin"
            placeholder="e.g. http://192.168.0.12:3000"
            className="font-mono text-xs"
            value={originOverride}
            onChange={(e) => persistOriginOverride(e.target.value)}
          />
          {isLocalhost &&
          !normalizeOrigin(originOverride) &&
          !envOrigin &&
          !devLanOrigin ? (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100 leading-snug space-y-1.5">
              <p className="font-medium">Phone can’t open “localhost”</p>
              <p>
                This page is <code className="rounded bg-background/80 px-1">localhost</code> — your
                phone would open <em>itself</em>, not your PC. Do one of the following:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Paste your PC’s Wi‑Fi URL here (see terminal <code className="text-[10px]">Network:</code>{" "}
                  or run <code className="text-[10px]">ipconfig</code> → IPv4), e.g.{" "}
                  <code className="text-[10px]">http://192.168.1.16:3000</code>
                </li>
                <li>
                  Or add <code className="text-[10px]">NEXT_PUBLIC_DEV_LAN_ORIGIN=http://…:3000</code> to{" "}
                  <code className="text-[10px]">.env.local</code> and restart <code className="text-[10px]">npm run dev</code>
                </li>
                <li>
                  Use <code className="text-[10px]">npm run dev:lan</code> and allow Node through Windows Firewall (Private networks)
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground leading-snug">
              Leave blank to use this page’s URL. Set your PC’s IP when testing from a phone on the same Wi‑Fi.
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center w-full max-w-[220px] mx-auto aspect-square rounded-lg border border-border bg-white p-3">
          {punchUrl ? (
            <QRCode
              value={punchUrl}
              size={180}
              level="M"
              className="h-auto w-full max-h-[180px]"
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center p-4">
              Generating QR…
            </div>
          )}
        </div>
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          Staff scan this code once at the branch, enter their PIN, and punch in or out
          automatically.
        </p>
        {punchUrl && (
          <p className="text-[10px] text-muted-foreground break-all font-mono leading-snug">
            {punchUrl}
          </p>
        )}
        {effectiveOrigin && (
          <p className="text-[10px] text-muted-foreground">
            Encoding: <span className="font-mono">{effectiveOrigin}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
