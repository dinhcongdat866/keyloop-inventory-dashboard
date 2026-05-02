import type { ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, FileText } from 'lucide-react';
import type { EnrichedCar } from '@/types/aging';
import type { AgingTier } from '@/types/aging';
import { ACTION_TYPE_META } from '@/constants/actionTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

const TIER_STYLES: Record<AgingTier, { label: string; classes: string }> = {
  HEALTHY: { label: 'Healthy', classes: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
  APPROACHING: {
    label: 'Approaching',
    classes: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  AGING: { label: 'Aging', classes: 'bg-red-100 text-red-900 border-red-200' },
  CRITICAL: {
    label: 'Critical',
    classes: 'bg-red-200 text-red-950 border-2 border-red-400',
  },
};

function AgingBadge({ tier, days }: { tier: AgingTier; days: number }) {
  const meta = TIER_STYLES[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
        meta.classes
      )}
      aria-label={`${meta.label} — ${days} days in stock`}
    >
      {(tier === 'AGING' || tier === 'CRITICAL') && (
        <AlertTriangle className="size-3" aria-hidden />
      )}
      {meta.label} · {days}d
    </span>
  );
}

function highlightMatch(text: string, query?: string): ReactNode {
  const q = query?.trim().toLowerCase();
  if (!q) return text;
  const lower = text.toLowerCase();
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const matchAt = lower.indexOf(q, i);
    if (matchAt === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (matchAt > i) parts.push(text.slice(i, matchAt));
    parts.push(
      <mark
        key={`${matchAt}-${i}`}
        className="rounded-sm bg-yellow-200/70 px-0.5 text-foreground"
      >
        {text.slice(matchAt, matchAt + q.length)}
      </mark>
    );
    i = matchAt + q.length;
  }
  return <>{parts}</>;
}

function Searchable({
  text,
  query,
  className,
}: {
  text: string;
  query?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'underline decoration-dotted decoration-muted-foreground/40 underline-offset-4',
        className
      )}
      title="Searchable"
    >
      {highlightMatch(text, query)}
    </span>
  );
}

type VehicleCardProps = {
  car: EnrichedCar;
  onOpenActions: (carId: string) => void;
  searchTerm?: string;
};

export function VehicleCard({ car, onOpenActions, searchTerm }: VehicleCardProps) {
  const latest = car.latestAction;
  const actionCount = car.actionLogs.length;

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <AgingBadge tier={car.agingTier} days={car.daysInStock} />
          <span className="text-sm font-semibold">{formatCurrency(car.price)}</span>
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">
            {car.year} {car.make} {car.model}
            {car.trim && (
              <span className="text-muted-foreground">
                {' · '}
                <Searchable text={car.trim} query={searchTerm} />
              </span>
            )}
          </h3>
          <p className="truncate text-xs text-muted-foreground" title={car.vin}>
            VIN <Searchable text={car.vin} query={searchTerm} />
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {car.color}
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {formatNumber(car.mileage)} mi
          </Badge>
          <Badge variant="secondary" className="font-normal">
            {car.condition.replace(/_/g, ' ').toLowerCase()}
          </Badge>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          {latest ? (
            <div className="min-w-0 text-xs">
              <p className="truncate font-medium" title={ACTION_TYPE_META[latest.type].label}>
                {ACTION_TYPE_META[latest.type].label}
              </p>
              <p className="text-muted-foreground">
                {formatDistanceToNow(new Date(latest.createdAt), { addSuffix: true })}
                {actionCount > 1 && ` · +${actionCount - 1} more`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No action logged</p>
          )}
          <Button
            variant={latest ? 'outline' : 'default'}
            size="sm"
            onClick={() => onOpenActions(car.id)}
          >
            <FileText className="size-3.5" />
            {latest ? `View (${actionCount})` : 'Add action'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
