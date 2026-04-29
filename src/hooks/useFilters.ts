import { useCallback, useState } from 'react';
import type { FilterState } from '@/types/filters';

export const INITIAL_FILTERS: FilterState = {
  search: '',
  makes: [],
  models: [],
  years: [],
  agingOnly: false,
  hasActionsOnly: null,
  sortBy: 'AGING_PRIORITY',
};

export function useFilters(initial: FilterState = INITIAL_FILTERS) {
  const [filters, setFilters] = useState<FilterState>(initial);

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);

  return { filters, setFilters, updateFilter, clearFilters };
}
