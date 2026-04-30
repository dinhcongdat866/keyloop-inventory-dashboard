import type { Car } from '@/types/vehicle';
import type { AgingPolicy, AgingTier, EnrichedCar } from '@/types/aging';
import type { ActionLog } from '@/types/action';
import { daysBetweenUtc } from '@/lib/utils/date';
import { logger } from '@/lib/observability/logger';

export function computeDaysInStock(importedDateIso: string, nowIso: string): number {
  return daysBetweenUtc(importedDateIso, nowIso);
}

export function computeAgingTier(daysInStock: number, policy: AgingPolicy): AgingTier {
  if (daysInStock >= policy.criticalDays) return 'CRITICAL';
  if (daysInStock >= policy.agingDays) return 'AGING';
  if (daysInStock >= policy.approachingDays) return 'APPROACHING';
  return 'HEALTHY';
}

export function isAgingTier(tier: AgingTier): boolean {
  return tier === 'AGING' || tier === 'CRITICAL';
}

function pickLatestAction(logs: ActionLog[]): ActionLog | undefined {
  if (logs.length === 0) return undefined;
  let latest = logs[0]!;
  for (let i = 1; i < logs.length; i++) {
    if (Date.parse(logs[i]!.createdAt) > Date.parse(latest.createdAt)) {
      latest = logs[i]!;
    }
  }
  return latest;
}

export function enrichCar(car: Car, policy: AgingPolicy, nowIso: string): EnrichedCar {
  const daysInStock = computeDaysInStock(car.importedDate, nowIso);
  if (daysInStock === 0 && Date.parse(car.importedDate) > Date.parse(nowIso)) {
    logger.warn('Future importedDate detected, daysInStock clamped to 0', {
      carId: car.id,
      importedDate: car.importedDate,
    });
  }
  const agingTier = computeAgingTier(daysInStock, policy);
  return {
    ...car,
    daysInStock,
    agingTier,
    hasActions: car.actionLogs.length > 0,
    latestAction: pickLatestAction(car.actionLogs),
  };
}

export function enrichCars(cars: Car[], policy: AgingPolicy, nowIso: string): EnrichedCar[] {
  return cars.map((c) => enrichCar(c, policy, nowIso));
}
