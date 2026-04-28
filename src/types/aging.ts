import type { Car } from './vehicle';
import type { ActionLog } from './action';

export type AgingTier = 'HEALTHY' | 'APPROACHING' | 'AGING' | 'CRITICAL';

export type AgingPolicy = {
  approachingDays: number;
  agingDays: number;
  criticalDays: number;
};

export type EnrichedCar = Car & {
  daysInStock: number;
  agingTier: AgingTier;
  hasActions: boolean;
  latestAction?: ActionLog;
};
