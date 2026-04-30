import type { AgingPolicy } from '@/types/aging';
import { AGING_POLICY_BOUNDS } from '@/constants/aging';

export type FieldErrors = Partial<Record<keyof AgingPolicy, string>>;

export function validateAgingPolicy(p: AgingPolicy): FieldErrors {
  const errors: FieldErrors = {};
  const { min, max } = AGING_POLICY_BOUNDS;

  for (const key of ['approachingDays', 'agingDays', 'criticalDays'] as const) {
    const v = p[key];
    if (!Number.isInteger(v) || v < min || v > max) {
      errors[key] = `Must be an integer between ${min} and ${max}`;
    }
  }
  if (!errors.agingDays && !errors.approachingDays && p.agingDays <= p.approachingDays) {
    errors.agingDays = 'Must be greater than Approaching';
  }
  if (!errors.criticalDays && !errors.agingDays && p.criticalDays <= p.agingDays) {
    errors.criticalDays = 'Must be greater than Aging';
  }
  return errors;
}
