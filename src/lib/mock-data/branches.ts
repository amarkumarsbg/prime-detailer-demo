import type { Branch } from "@/types";

export const branches: Branch[] = [
  {
    id: "br-001",
    name: "Prime Detailers Koramangala",
    code: "PRM-KRM",
    address: "80 Feet Road, Koramangala 4th Block",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    phone: "+91-80-41234567",
    email: "krm@primedetailers.in",
    isActive: true,
    qrCodeId: "qr-br-001",
  },
  {
    id: "br-002",
    name: "Prime Detailers Whitefield",
    code: "PRM-WFD",
    address: "EPIP Zone, Whitefield Main Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560066",
    phone: "+91-80-41234568",
    email: "wfd@primedetailers.in",
    isActive: true,
    qrCodeId: "qr-br-002",
  },
];
