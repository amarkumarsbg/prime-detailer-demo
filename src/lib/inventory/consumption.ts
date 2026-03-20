import type {
  JobCard,
  Part,
  ServiceCatalogItem,
  ServiceConsumption,
} from "@/types";

export type ConsumptionDeduction = {
  partId: string;
  ml?: number;
  count?: number;
};

const ML_UNITS = new Set(["ML", "L", "LITRE", "LITRES"]);
const COUNT_UNITS = new Set([
  "NOS",
  "SET",
  "KIT",
  "PIECE",
  "PIECES",
  "PCS",
  "ROLL",
]);

function normalizeUnit(unit: string): string {
  return unit.trim().toUpperCase();
}

/** Convert a single consumption line to ml and/or count deduction. */
export function consumptionLineToDeduction(
  line: ServiceConsumption
): ConsumptionDeduction {
  const u = normalizeUnit(line.unit);
  if (u === "L" || u === "LITRE" || u === "LITRES") {
    return {
      partId: line.partId,
      ml: line.quantityPerCar * 1000,
    };
  }
  if (u === "ML") {
    return { partId: line.partId, ml: line.quantityPerCar };
  }
  if (COUNT_UNITS.has(u) || !ML_UNITS.has(u)) {
    return { partId: line.partId, count: line.quantityPerCar };
  }
  return { partId: line.partId, count: line.quantityPerCar };
}

function mergeDeductions(lines: ConsumptionDeduction[]): ConsumptionDeduction[] {
  const byPart = new Map<string, { ml: number; count: number }>();
  for (const line of lines) {
    const cur = byPart.get(line.partId) ?? { ml: 0, count: 0 };
    if (line.ml != null) cur.ml += line.ml;
    if (line.count != null) cur.count += line.count;
    byPart.set(line.partId, cur);
  }
  const out: ConsumptionDeduction[] = [];
  for (const [partId, v] of byPart) {
    const o: ConsumptionDeduction = { partId };
    if (v.ml > 0) o.ml = v.ml;
    if (v.count > 0) o.count = v.count;
    if (o.ml != null || o.count != null) out.push(o);
  }
  return out;
}

/** All consumption lines for services on a job card (catalog lookup by id). */
export function deductionsForJob(
  job: JobCard,
  catalog: ServiceCatalogItem[]
): ConsumptionDeduction[] {
  const catalogById = new Map(catalog.map((c) => [c.id, c]));
  const raw: ConsumptionDeduction[] = [];

  for (const svc of job.services) {
    const item = catalogById.get(svc.serviceCatalogId);
    if (!item?.consumptionProfile?.length) continue;
    for (const line of item.consumptionProfile) {
      raw.push(consumptionLineToDeduction(line));
    }
  }

  return mergeDeductions(raw);
}

/** ML consumed per car for one part on a given service (single-service bottleneck). */
export function mlPerCarForPartOnService(
  partId: string,
  service: ServiceCatalogItem
): number {
  if (!service.consumptionProfile) return 0;
  let total = 0;
  for (const line of service.consumptionProfile) {
    if (line.partId !== partId) continue;
    const d = consumptionLineToDeduction(line);
    if (d.ml != null) total += d.ml;
  }
  return total;
}

/** Cars serviceable for one part limited by that part only (floor). */
export function carsPossibleForPartAndService(
  part: Part,
  service: ServiceCatalogItem
): number {
  const ml = part.stockQuantityMl;
  if (ml == null || ml <= 0) return 0;
  const per = mlPerCarForPartOnService(part.id, service);
  if (per <= 0) return 0;
  return Math.floor(ml / per);
}

/** Minimum cars across all ml-consuming parts in a service (bottleneck). */
export function carsPossibleBottleneck(
  partsById: Map<string, Part>,
  service: ServiceCatalogItem
): number {
  if (!service.consumptionProfile?.length) return Infinity;
  let minCars = Infinity;
  for (const line of service.consumptionProfile) {
    const d = consumptionLineToDeduction(line);
    if (d.ml == null) continue;
    const p = partsById.get(line.partId);
    const ml = p?.stockQuantityMl;
    if (ml == null || ml <= 0) {
      minCars = 0;
      break;
    }
    const per = d.ml;
    minCars = Math.min(minCars, Math.floor(ml / per));
  }
  return minCars === Infinity ? 0 : minCars;
}
