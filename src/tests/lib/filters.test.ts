import { describe, it, expect } from 'vitest';
import { applyFilters } from '@/lib/inventory/filters';
import type { EnrichedCar } from '@/types/aging';
import type { FilterState } from '@/types/filters';

const INITIAL_FILTERS: FilterState = {
  search: '',
  makes: [],
  models: [],
  years: [],
  agingOnly: false,
  hasActionsOnly: null,
  sortBy: 'AGING_PRIORITY',
};

function car(overrides: Partial<EnrichedCar> = {}): EnrichedCar {
  return {
    id: 'car-x',
    vin: 'VIN0000000000001',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    condition: 'NEW',
    price: 28_500_00,
    mileage: 12,
    color: 'Silver',
    importedDate: '2026-04-01T00:00:00Z',
    dealershipId: 'dealer-001',
    actionLogs: [],
    daysInStock: 27,
    agingTier: 'HEALTHY',
    hasActions: false,
    ...overrides,
  };
}

describe('applyFilters — search', () => {
  const cars = [
    car({ id: '1', vin: 'AAAAAAAAAAAAAAA01', model: 'Camry' }),
    car({ id: '2', vin: 'BBBBBBBBBBBBBBB02', model: 'Civic', make: 'Honda' }),
    car({ id: '3', vin: 'CCCCCCCCCCCCCCC03', model: 'Camry', trim: 'XLE' }),
  ];

  it('returns all when search is empty', () => {
    expect(applyFilters(cars, INITIAL_FILTERS)).toHaveLength(3);
  });

  it('matches by VIN substring case-insensitive', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, search: 'bbb' });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe('2');
  });

  it('matches by model name', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, search: 'camry' });
    expect(r.map((c) => c.id)).toEqual(['1', '3']);
  });

  it('matches by trim', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, search: 'xle' });
    expect(r).toHaveLength(1);
    expect(r[0]!.id).toBe('3');
  });

  it('matches by make', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, search: 'honda' });
    expect(r).toHaveLength(1);
  });

  it('treats whitespace-only search as empty', () => {
    expect(applyFilters(cars, { ...INITIAL_FILTERS, search: '   ' })).toHaveLength(3);
  });
});

describe('applyFilters — array filters', () => {
  const cars = [
    car({ id: '1', make: 'Toyota', model: 'Camry', year: 2024 }),
    car({ id: '2', make: 'Honda', model: 'Civic', year: 2023 }),
    car({ id: '3', make: 'Toyota', model: 'RAV4', year: 2025 }),
  ];

  it('filters by makes (multi-select)', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, makes: ['Toyota'] });
    expect(r.map((c) => c.id)).toEqual(['1', '3']);
  });

  it('filters by years', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, years: [2023, 2024] });
    expect(r.map((c) => c.id)).toEqual(['1', '2']);
  });

  it('combines makes + models (AND across fields)', () => {
    const r = applyFilters(cars, {
      ...INITIAL_FILTERS,
      makes: ['Toyota'],
      models: ['Camry'],
    });
    expect(r.map((c) => c.id)).toEqual(['1']);
  });

  it('empty arrays mean no constraint', () => {
    expect(applyFilters(cars, { ...INITIAL_FILTERS, makes: [] })).toHaveLength(3);
  });
});

describe('applyFilters — days in stock range', () => {
  const cars = [
    car({ id: '1', daysInStock: 10 }),
    car({ id: '2', daysInStock: 50 }),
    car({ id: '3', daysInStock: 100 }),
    car({ id: '4', daysInStock: 200 }),
  ];

  it('applies min only', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, daysInStockMin: 50 });
    expect(r.map((c) => c.id)).toEqual(['2', '3', '4']);
  });

  it('applies max only', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, daysInStockMax: 50 });
    expect(r.map((c) => c.id)).toEqual(['1', '2']);
  });

  it('applies both bounds inclusive', () => {
    const r = applyFilters(cars, {
      ...INITIAL_FILTERS,
      daysInStockMin: 50,
      daysInStockMax: 100,
    });
    expect(r.map((c) => c.id)).toEqual(['2', '3']);
  });
});

describe('applyFilters — agingOnly toggle', () => {
  const cars = [
    car({ id: 'h', agingTier: 'HEALTHY' }),
    car({ id: 'a', agingTier: 'APPROACHING' }),
    car({ id: 'g', agingTier: 'AGING' }),
    car({ id: 'c', agingTier: 'CRITICAL' }),
  ];

  it('keeps only AGING and CRITICAL when on', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, agingOnly: true });
    expect(r.map((c) => c.id)).toEqual(['g', 'c']);
  });

  it('keeps everything when off', () => {
    expect(applyFilters(cars, { ...INITIAL_FILTERS, agingOnly: false })).toHaveLength(4);
  });
});

describe('applyFilters — hasActionsOnly tri-state', () => {
  const cars = [
    car({ id: 'with', hasActions: true }),
    car({ id: 'without', hasActions: false }),
  ];

  it('null = any', () => {
    expect(applyFilters(cars, { ...INITIAL_FILTERS, hasActionsOnly: null })).toHaveLength(2);
  });

  it('true keeps only with actions', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, hasActionsOnly: true });
    expect(r.map((c) => c.id)).toEqual(['with']);
  });

  it('false keeps only without actions', () => {
    const r = applyFilters(cars, { ...INITIAL_FILTERS, hasActionsOnly: false });
    expect(r.map((c) => c.id)).toEqual(['without']);
  });
});
