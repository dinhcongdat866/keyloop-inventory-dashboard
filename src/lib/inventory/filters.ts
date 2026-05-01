import type { EnrichedCar } from '@/types/aging';
import type { FilterState } from '@/types/filters';
import { isAgingTier } from './aging';

function matchesSearch(car: EnrichedCar, search: string): boolean {
  if (!search) return true;
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    car.vin.toLowerCase().includes(q) ||
    (car.trim?.toLowerCase().includes(q) ?? false)
  );
}

function matchesArrayFilter<T>(value: T, allowed: T[]): boolean {
  return allowed.length === 0 || allowed.includes(value);
}

function matchesDaysRange(days: number, min?: number, max?: number): boolean {
  if (min !== undefined && days < min) return false;
  if (max !== undefined && days > max) return false;
  return true;
}

function matchesHasActions(car: EnrichedCar, hasActionsOnly: boolean | null): boolean {
  if (hasActionsOnly === null) return true;
  return car.hasActions === hasActionsOnly;
}

export function applyFilters(cars: EnrichedCar[], filters: FilterState): EnrichedCar[] {
  return cars.filter((car) => {
    if (!matchesSearch(car, filters.search)) return false;
    if (!matchesArrayFilter(car.make, filters.makes)) return false;
    if (!matchesArrayFilter(car.model, filters.models)) return false;
    if (!matchesArrayFilter(car.year, filters.years)) return false;
    if (!matchesDaysRange(car.daysInStock, filters.daysInStockMin, filters.daysInStockMax)) {
      return false;
    }
    if (filters.agingOnly && !isAgingTier(car.agingTier)) return false;
    if (!matchesHasActions(car, filters.hasActionsOnly)) return false;
    return true;
  });
}
