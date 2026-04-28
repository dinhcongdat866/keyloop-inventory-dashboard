import { describe, it, expect } from 'vitest';
import { computeStats } from '@/lib/inventory/stats';
import type { EnrichedCar } from '@/types/aging';

function car(overrides: Partial<EnrichedCar> = {}): EnrichedCar {
  return {
    id: 'x',
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

describe('computeStats', () => {
  it('returns zeroed stats for empty input', () => {
    expect(computeStats([])).toEqual({
      total: 0,
      agingCount: 0,
      approachingCount: 0,
      criticalCount: 0,
      agingValue: 0,
      avgDaysInStock: 0,
      uncoveredAgingCount: 0,
    });
  });

  it('counts tiers correctly', () => {
    const cars: EnrichedCar[] = [
      car({ agingTier: 'HEALTHY', daysInStock: 10 }),
      car({ agingTier: 'APPROACHING', daysInStock: 70 }),
      car({ agingTier: 'AGING', daysInStock: 100 }),
      car({ agingTier: 'AGING', daysInStock: 110 }),
      car({ agingTier: 'CRITICAL', daysInStock: 130 }),
    ];
    const stats = computeStats(cars);
    expect(stats.total).toBe(5);
    expect(stats.approachingCount).toBe(1);
    expect(stats.agingCount).toBe(3);
    expect(stats.criticalCount).toBe(1);
  });

  it('sums agingValue from AGING + CRITICAL prices only', () => {
    const cars: EnrichedCar[] = [
      car({ agingTier: 'HEALTHY', price: 100_00 }),
      car({ agingTier: 'AGING', price: 28_500_00 }),
      car({ agingTier: 'CRITICAL', price: 50_000_00 }),
    ];
    expect(computeStats(cars).agingValue).toBe(28_500_00 + 50_000_00);
  });

  it('avgDaysInStock rounds to nearest integer', () => {
    const cars: EnrichedCar[] = [
      car({ daysInStock: 10 }),
      car({ daysInStock: 20 }),
      car({ daysInStock: 31 }),
    ];
    expect(computeStats(cars).avgDaysInStock).toBe(20);
  });

  it('uncoveredAgingCount: only aging cars without actions', () => {
    const cars: EnrichedCar[] = [
      car({ agingTier: 'AGING', hasActions: false }),
      car({ agingTier: 'AGING', hasActions: true }),
      car({ agingTier: 'CRITICAL', hasActions: false }),
      car({ agingTier: 'HEALTHY', hasActions: false }),
    ];
    expect(computeStats(cars).uncoveredAgingCount).toBe(2);
  });
});
