import type { EnrichedCar } from '@/types/aging';
import type { SortKey } from '@/types/filters';

function priorityRank(car: EnrichedCar): number {
  const noAction = !car.hasActions;
  switch (car.agingTier) {
    case 'CRITICAL':
      return noAction ? 0 : 2;
    case 'AGING':
      return noAction ? 1 : 3;
    case 'APPROACHING':
      return 4;
    case 'HEALTHY':
      return 5;
  }
}

function compareDaysDesc(a: EnrichedCar, b: EnrichedCar): number {
  return b.daysInStock - a.daysInStock;
}

function compareLatestActionDesc(a: EnrichedCar, b: EnrichedCar): number {
  const aTs = a.latestAction ? Date.parse(a.latestAction.createdAt) : -Infinity;
  const bTs = b.latestAction ? Date.parse(b.latestAction.createdAt) : -Infinity;
  return bTs - aTs;
}

const COMPARATORS: Record<SortKey, (a: EnrichedCar, b: EnrichedCar) => number> = {
  AGING_PRIORITY: (a, b) => {
    const rank = priorityRank(a) - priorityRank(b);
    return rank !== 0 ? rank : compareDaysDesc(a, b);
  },
  DAYS_DESC: compareDaysDesc,
  DAYS_ASC: (a, b) => a.daysInStock - b.daysInStock,
  PRICE_DESC: (a, b) => b.price - a.price,
  PRICE_ASC: (a, b) => a.price - b.price,
  RECENT_ACTION: compareLatestActionDesc,
};

export function applySort(cars: EnrichedCar[], sortBy: SortKey): EnrichedCar[] {
  return [...cars].sort(COMPARATORS[sortBy]);
}
