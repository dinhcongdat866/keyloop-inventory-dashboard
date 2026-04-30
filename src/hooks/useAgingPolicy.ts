import { useEffect, useState } from 'react';
import type { AgingPolicy } from '@/types/aging';
import { AGING_POLICY_STORAGE_KEY, DEFAULT_AGING_POLICY } from '@/constants/aging';

function readPolicy(): AgingPolicy {
  if (typeof localStorage === 'undefined') return DEFAULT_AGING_POLICY;
  try {
    const raw = localStorage.getItem(AGING_POLICY_STORAGE_KEY);
    if (!raw) return DEFAULT_AGING_POLICY;
    const parsed = JSON.parse(raw) as Partial<AgingPolicy>;
    if (
      typeof parsed?.approachingDays === 'number' &&
      typeof parsed?.agingDays === 'number' &&
      typeof parsed?.criticalDays === 'number'
    ) {
      return parsed as AgingPolicy;
    }
    return DEFAULT_AGING_POLICY;
  } catch {
    return DEFAULT_AGING_POLICY;
  }
}

export function useAgingPolicy() {
  const [policy, setPolicyState] = useState<AgingPolicy>(readPolicy);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(AGING_POLICY_STORAGE_KEY, JSON.stringify(policy));
  }, [policy]);

  const setPolicy = (next: AgingPolicy) => setPolicyState(next);
  const resetPolicy = () => setPolicyState(DEFAULT_AGING_POLICY);

  return { policy, setPolicy, resetPolicy };
}
