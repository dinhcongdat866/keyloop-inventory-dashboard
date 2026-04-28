import { describe, it, expect } from 'vitest';
import {
  computeDaysInStock,
  computeAgingTier,
  isAgingTier,
  enrichCar,
} from '@/lib/inventory/aging';
import { DEFAULT_AGING_POLICY } from '@/constants/aging';
import type { Car } from '@/types/vehicle';

const NOW = '2026-04-28T00:00:00Z';

function carAt(daysAgo: number, overrides: Partial<Car> = {}): Car {
  const imported = new Date(Date.parse(NOW) - daysAgo * 86_400_000).toISOString();
  return {
    id: 'car-1',
    vin: 'VIN0000000000001',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    condition: 'NEW',
    price: 28_500_00,
    mileage: 12,
    color: 'Silver',
    importedDate: imported,
    dealershipId: 'dealer-001',
    actionLogs: [],
    ...overrides,
  };
}

describe('computeDaysInStock', () => {
  it('returns whole days between imported date and now', () => {
    expect(computeDaysInStock('2026-04-01T00:00:00Z', NOW)).toBe(27);
  });

  it('returns 0 when imported same instant as now', () => {
    expect(computeDaysInStock(NOW, NOW)).toBe(0);
  });

  it('floors partial days', () => {
    expect(computeDaysInStock('2026-04-27T12:00:00Z', NOW)).toBe(0);
    expect(computeDaysInStock('2026-04-26T23:00:00Z', NOW)).toBe(1);
  });

  it('clamps future imported dates to 0 (data anomaly safe)', () => {
    expect(computeDaysInStock('2027-01-01T00:00:00Z', NOW)).toBe(0);
  });

  it('returns 0 for invalid date strings rather than NaN', () => {
    expect(computeDaysInStock('not-a-date', NOW)).toBe(0);
  });
});

describe('computeAgingTier', () => {
  const policy = DEFAULT_AGING_POLICY; // 60 / 90 / 120

  it('classifies HEALTHY below approachingDays', () => {
    expect(computeAgingTier(0, policy)).toBe('HEALTHY');
    expect(computeAgingTier(59, policy)).toBe('HEALTHY');
  });

  it('classifies APPROACHING at approachingDays inclusive', () => {
    expect(computeAgingTier(60, policy)).toBe('APPROACHING');
    expect(computeAgingTier(89, policy)).toBe('APPROACHING');
  });

  it('classifies AGING at agingDays inclusive', () => {
    expect(computeAgingTier(90, policy)).toBe('AGING');
    expect(computeAgingTier(119, policy)).toBe('AGING');
  });

  it('classifies CRITICAL at criticalDays inclusive', () => {
    expect(computeAgingTier(120, policy)).toBe('CRITICAL');
    expect(computeAgingTier(365, policy)).toBe('CRITICAL');
  });

  it('respects custom policy (used cars: 30/45/60)', () => {
    const used = { approachingDays: 30, agingDays: 45, criticalDays: 60 };
    expect(computeAgingTier(29, used)).toBe('HEALTHY');
    expect(computeAgingTier(30, used)).toBe('APPROACHING');
    expect(computeAgingTier(45, used)).toBe('AGING');
    expect(computeAgingTier(60, used)).toBe('CRITICAL');
  });
});

describe('isAgingTier', () => {
  it('considers AGING and CRITICAL as aging', () => {
    expect(isAgingTier('AGING')).toBe(true);
    expect(isAgingTier('CRITICAL')).toBe(true);
  });

  it('does not consider HEALTHY or APPROACHING as aging', () => {
    expect(isAgingTier('HEALTHY')).toBe(false);
    expect(isAgingTier('APPROACHING')).toBe(false);
  });
});

describe('enrichCar', () => {
  it('produces daysInStock, agingTier, hasActions, latestAction', () => {
    const car = carAt(95, {
      actionLogs: [
        {
          id: 'l1',
          carId: 'car-1',
          type: 'PRICE_REDUCTION_PLANNED',
          createdAt: '2026-04-20T00:00:00Z',
          createdBy: 'manager-001',
        },
        {
          id: 'l2',
          carId: 'car-1',
          type: 'TRANSFER_TO_BRANCH',
          createdAt: '2026-04-25T00:00:00Z',
          createdBy: 'manager-001',
        },
      ],
    });

    const enriched = enrichCar(car, DEFAULT_AGING_POLICY, NOW);
    expect(enriched.daysInStock).toBe(95);
    expect(enriched.agingTier).toBe('AGING');
    expect(enriched.hasActions).toBe(true);
    expect(enriched.latestAction?.id).toBe('l2');
  });

  it('marks hasActions=false and latestAction=undefined when no logs', () => {
    const enriched = enrichCar(carAt(10), DEFAULT_AGING_POLICY, NOW);
    expect(enriched.hasActions).toBe(false);
    expect(enriched.latestAction).toBeUndefined();
  });

  it('preserves original car fields', () => {
    const enriched = enrichCar(carAt(10, { vin: 'KEEPME0000000001A' }), DEFAULT_AGING_POLICY, NOW);
    expect(enriched.vin).toBe('KEEPME0000000001A');
    expect(enriched.make).toBe('Toyota');
  });
});
