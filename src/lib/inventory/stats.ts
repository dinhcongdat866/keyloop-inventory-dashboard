import type { EnrichedCar } from '@/types/aging';
import type { InventoryStats } from '@/types/stats';
import { isAgingTier } from './aging';

export function computeStats(cars: EnrichedCar[]): InventoryStats {
  if (cars.length === 0) {
    return {
      total: 0,
      agingCount: 0,
      approachingCount: 0,
      criticalCount: 0,
      agingValue: 0,
      avgDaysInStock: 0,
      uncoveredAgingCount: 0,
    };
  }

  let agingCount = 0;
  let approachingCount = 0;
  let criticalCount = 0;
  let agingValue = 0;
  let totalDays = 0;
  let uncoveredAgingCount = 0;

  for (const car of cars) {
    totalDays += car.daysInStock;
    if (car.agingTier === 'APPROACHING') approachingCount++;
    if (car.agingTier === 'CRITICAL') criticalCount++;
    if (isAgingTier(car.agingTier)) {
      agingCount++;
      agingValue += car.price;
      if (!car.hasActions) uncoveredAgingCount++;
    }
  }

  return {
    total: cars.length,
    agingCount,
    approachingCount,
    criticalCount,
    agingValue,
    avgDaysInStock: Math.round(totalDays / cars.length),
    uncoveredAgingCount,
  };
}
