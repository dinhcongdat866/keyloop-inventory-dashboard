import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import { cn } from '@/lib/utils';

type HeaderProps = {
  dealershipName?: string;
  fetchedAt?: string;
  isFetching?: boolean;
  onRefresh?: () => void;
  rightSlot?: React.ReactNode;
};

export function Header({
  dealershipName,
  fetchedAt,
  isFetching,
  onRefresh,
  rightSlot,
}: HeaderProps) {
  const lastUpdated = useRelativeTime(fetchedAt);

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Keyloop Inventory
          </p>
          <h1 className="truncate text-lg font-semibold md:text-xl">
            {dealershipName ?? 'Loading…'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Updated {lastUpdated}
            </span>
          )}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
              aria-label="Refresh inventory"
            >
              <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
