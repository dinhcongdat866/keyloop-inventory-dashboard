import type { AgingPolicy } from '@/types/aging';

export const DEFAULT_AGING_POLICY: AgingPolicy = {
  approachingDays: 60,
  agingDays: 90,
  criticalDays: 120,
};

export const AGING_POLICY_BOUNDS = {
  min: 1,
  max: 365,
} as const;

export const AGING_POLICY_PRESETS: Record<string, AgingPolicy> = {
  NEW_CARS: { approachingDays: 60, agingDays: 90, criticalDays: 120 },
  USED_CARS: { approachingDays: 30, agingDays: 45, criticalDays: 60 },
  LUXURY: { approachingDays: 90, agingDays: 120, criticalDays: 150 },
};

export const AGING_POLICY_STORAGE_KEY = 'keyloop:aging-policy';
