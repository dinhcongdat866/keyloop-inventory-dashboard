import { describe, it, expect } from 'vitest';
import { applySort } from '@/lib/inventory/sort';
import type { EnrichedCar } from '@/types/aging';
import type { ActionLog } from '@/types/action';

function action(createdAt: string): ActionLog {
  return {
    id: 'l-' + createdAt,
    carId: 'x',
    type: 'PRICE_REDUCTION_PLANNED',
    createdAt,
    createdBy: 'manager-001',
  };
}

function car(overrides: Partial<EnrichedCar> = {}): EnrichedCar {
  return {
    id: 'car-x',
    vin: 'V',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    condition: 'NEW',
    price: 30_000_00,
    mileage: 12,
    color: 'Silver',
    importedDate: '2026-01-01T00:00:00Z',
    dealershipId: 'd1',
    actionLogs: [],
    daysInStock: 10,
    agingTier: 'HEALTHY',
    hasActions: false,
    ...overrides,
  };
}

describe('applySort — AGING_PRIORITY', () => {
  it('orders by tier priority and uncovered status, then daysInStock desc', () => {
    const cars: EnrichedCar[] = [
      car({ id: 'healthy', agingTier: 'HEALTHY', daysInStock: 10 }),
      car({ id: 'aging-with', agingTier: 'AGING', daysInStock: 95, hasActions: true }),
      car({ id: 'critical-without', agingTier: 'CRITICAL', daysInStock: 130 }),
      car({ id: 'aging-without', agingTier: 'AGING', daysInStock: 100 }),
      car({ id: 'critical-with', agingTier: 'CRITICAL', daysInStock: 150, hasActions: true }),
      car({ id: 'approaching', agingTier: 'APPROACHING', daysInStock: 70 }),
    ];

    const sorted = applySort(cars, 'AGING_PRIORITY');
    expect(sorted.map((c) => c.id)).toEqual([
      'critical-without',
      'aging-without',
      'critical-with',
      'aging-with',
      'approaching',
      'healthy',
    ]);
  });

  it('within same tier+action group, more days first', () => {
    const cars: EnrichedCar[] = [
      car({ id: 'a', agingTier: 'AGING', daysInStock: 95 }),
      car({ id: 'b', agingTier: 'AGING', daysInStock: 110 }),
      car({ id: 'c', agingTier: 'AGING', daysInStock: 100 }),
    ];
    const sorted = applySort(cars, 'AGING_PRIORITY');
    expect(sorted.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate input array', () => {
    const cars: EnrichedCar[] = [car({ id: '1', daysInStock: 10 }), car({ id: '2', daysInStock: 50 })];
    const before = cars.map((c) => c.id);
    applySort(cars, 'DAYS_DESC');
    expect(cars.map((c) => c.id)).toEqual(before);
  });
});

describe('applySort — DAYS_DESC / DAYS_ASC', () => {
  const cars: EnrichedCar[] = [
    car({ id: 'a', daysInStock: 50 }),
    car({ id: 'b', daysInStock: 200 }),
    car({ id: 'c', daysInStock: 10 }),
  ];

  it('DAYS_DESC: most days first', () => {
    expect(applySort(cars, 'DAYS_DESC').map((c) => c.id)).toEqual(['b', 'a', 'c']);
  });

  it('DAYS_ASC: fewest days first', () => {
    expect(applySort(cars, 'DAYS_ASC').map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('applySort — PRICE', () => {
  const cars: EnrichedCar[] = [
    car({ id: 'cheap', price: 20_000_00 }),
    car({ id: 'lux', price: 80_000_00 }),
    car({ id: 'mid', price: 35_000_00 }),
  ];

  it('PRICE_DESC: most expensive first', () => {
    expect(applySort(cars, 'PRICE_DESC').map((c) => c.id)).toEqual(['lux', 'mid', 'cheap']);
  });

  it('PRICE_ASC: cheapest first', () => {
    expect(applySort(cars, 'PRICE_ASC').map((c) => c.id)).toEqual(['cheap', 'mid', 'lux']);
  });
});

describe('applySort — RECENT_ACTION', () => {
  it('sorts by latest action timestamp desc; cars without action sink', () => {
    const cars: EnrichedCar[] = [
      car({ id: 'noact', hasActions: false }),
      car({
        id: 'old',
        hasActions: true,
        latestAction: action('2026-01-01T00:00:00Z'),
      }),
      car({
        id: 'recent',
        hasActions: true,
        latestAction: action('2026-04-20T00:00:00Z'),
      }),
    ];
    expect(applySort(cars, 'RECENT_ACTION').map((c) => c.id)).toEqual(['recent', 'old', 'noact']);
  });
});
