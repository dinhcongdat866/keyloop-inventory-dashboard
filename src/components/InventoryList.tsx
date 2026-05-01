import { Car as CarIcon, AlertCircle, Search } from 'lucide-react';
import type { EnrichedCar } from '@/types/aging';
import { VehicleCard } from './VehicleCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type InventoryListProps = {
  cars: EnrichedCar[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  onOpenActions: (carId: string) => void;
  onClearFilters?: () => void;
  onRetry?: () => void;
  searchTerm?: string;
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="space-y-3 p-4">
            <div className="flex justify-between">
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="h-5 w-16 rounded bg-muted" />
            </div>
            <div className="h-5 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/2 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-5 w-12 rounded bg-muted" />
              <div className="h-5 w-16 rounded bg-muted" />
            </div>
            <div className="flex justify-between border-t pt-3">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-7 w-20 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div>
          <h3 className="font-semibold">Failed to load inventory</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({
  totalCount,
  onClearFilters,
}: {
  totalCount: number;
  onClearFilters?: () => void;
}) {
  const filtered = totalCount > 0;
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        {filtered ? (
          <Search className="size-8 text-muted-foreground" />
        ) : (
          <CarIcon className="size-8 text-muted-foreground" />
        )}
        <div>
          <h3 className="font-semibold">
            {filtered ? 'No vehicles match your filters' : 'No vehicles in inventory'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filtered
              ? 'Try removing some filters or clear all.'
              : 'New vehicles will appear here once added.'}
          </p>
        </div>
        {filtered && onClearFilters && (
          <Button onClick={onClearFilters} variant="outline" size="sm">
            Clear filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function InventoryList({
  cars,
  totalCount,
  isLoading,
  error,
  onOpenActions,
  onClearFilters,
  onRetry,
  searchTerm,
}: InventoryListProps) {
  if (isLoading && cars.length === 0) return <LoadingSkeleton />;
  if (error && totalCount === 0) return <ErrorState error={error} onRetry={onRetry} />;
  if (cars.length === 0) {
    return <EmptyState totalCount={totalCount} onClearFilters={onClearFilters} />;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cars.map((car) => (
        <VehicleCard
          key={car.id}
          car={car}
          onOpenActions={onOpenActions}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
}
