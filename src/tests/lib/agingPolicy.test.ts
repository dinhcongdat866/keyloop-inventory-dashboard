import { describe, it, expect } from 'vitest';
import { validateAgingPolicy } from '@/lib/inventory/agingPolicy';
import type { AgingPolicy } from '@/types/aging';

function makePolicy(overrides: Partial<AgingPolicy> = {}): AgingPolicy {
  return { approachingDays: 60, agingDays: 90, criticalDays: 120, ...overrides };
}

describe('validateAgingPolicy', () => {
  it('returns no errors for a valid policy', () => {
    expect(validateAgingPolicy(makePolicy())).toEqual({});
  });

  it('errors when a field is below minimum (1)', () => {
    const errors = validateAgingPolicy(makePolicy({ approachingDays: 0 }));
    expect(errors.approachingDays).toMatch(/integer between 1 and 365/i);
  });

  it('errors when a field exceeds maximum (365)', () => {
    const errors = validateAgingPolicy(makePolicy({ criticalDays: 366 }));
    expect(errors.criticalDays).toMatch(/integer between 1 and 365/i);
  });

  it('errors when a field is not an integer', () => {
    const errors = validateAgingPolicy(makePolicy({ agingDays: 45.5 }));
    expect(errors.agingDays).toMatch(/integer between 1 and 365/i);
  });

  it('errors when agingDays <= approachingDays', () => {
    const errors = validateAgingPolicy(makePolicy({ approachingDays: 90, agingDays: 90 }));
    expect(errors.agingDays).toMatch(/greater than approaching/i);
  });

  it('errors when criticalDays <= agingDays', () => {
    const errors = validateAgingPolicy(makePolicy({ agingDays: 100, criticalDays: 100 }));
    expect(errors.criticalDays).toMatch(/greater than aging/i);
  });

  it('skips monotonic check when a field already has a range error', () => {
    // agingDays is out of range — monotonic error on criticalDays must not appear
    const errors = validateAgingPolicy(makePolicy({ agingDays: 0, criticalDays: 5 }));
    expect(errors.agingDays).toMatch(/integer between/i);
    expect(errors.criticalDays).toBeUndefined();
  });
});
