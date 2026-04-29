import { useMemo } from 'react';
import { Header } from '@/components/Header';
import { SummaryCards } from '@/components/SummaryCards';
import { FiltersBar } from '@/components/FiltersBar';
import { InventoryList } from '@/components/InventoryList';
import { useInventory } from '@/hooks/useInventory';
import { useFilters } from '@/hooks/useFilters';
import { useAgingPolicy } from '@/hooks/useAgingPolicy';
import { useToday } from '@/hooks/useToday';
import { enrichCars } from '@/lib/inventory/aging';
import { applyFilters } from '@/lib/inventory/filters';
import { applySort } from '@/lib/inventory/sort';
import { computeStats } from '@/lib/inventory/stats';

const DEALERSHIP_ID = 'dealer-001';

export default function App() {
  const { data, isLoading, isFetching, error, refetch } = useInventory(DEALERSHIP_ID);
  const { filters, updateFilter, clearFilters } = useFilters();
  const { policy } = useAgingPolicy();
  const today = useToday();

  const enriched = useMemo(
    () => (data ? enrichCars(data.cars, policy, today) : []),
    [data, policy, today]
  );

  const filtered = useMemo(() => applyFilters(enriched, filters), [enriched, filters]);
  const sorted = useMemo(() => applySort(filtered, filters.sortBy), [filtered, filters.sortBy]);
  const stats = useMemo(() => computeStats(enriched), [enriched]);

  const handleOpenActions = (carId: string) => {
    // TODO: wire ActionsModal in next step
    console.info('open actions', carId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        dealershipName={data?.dealershipName}
        fetchedAt={data?.fetchedAt}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
      />

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 md:px-6">
        <SummaryCards stats={data ? stats : undefined} isLoading={isLoading} />

        <FiltersBar
          filters={filters}
          onChange={updateFilter}
          onClear={clearFilters}
          inventory={enriched}
          resultCount={sorted.length}
          totalCount={enriched.length}
        />

        <InventoryList
          cars={sorted}
          totalCount={enriched.length}
          isLoading={isLoading}
          error={error}
          onOpenActions={handleOpenActions}
          onClearFilters={clearFilters}
          onRetry={() => void refetch()}
          searchTerm={filters.search}
        />
      </main>
    </div>
  );
}
