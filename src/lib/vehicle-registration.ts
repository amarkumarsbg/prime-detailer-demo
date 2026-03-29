import type { Vehicle } from "@/types";

/** Normalizes registration for duplicate checks (case- and space-insensitive). */
export function normalizeRegistrationNumber(reg: string): string {
  return reg.trim().toUpperCase().replace(/\s/g, "");
}

export function findVehicleByNormalizedReg(vehicles: Vehicle[], registrationInput: string): Vehicle | undefined {
  const key = normalizeRegistrationNumber(registrationInput);
  return vehicles.find((v) => normalizeRegistrationNumber(v.registrationNumber) === key);
}
