import { Boxes, AlertTriangle, DollarSign, Clock } from 'lucide-react';
import type { InventoryStats } from '@/types/stats';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCompactCurrency, formatNumber } from '@/lib/utils/format';

type SummaryCardsProps = {
  stats?: InventoryStats;
  isLoading?: boolean;
};

type Tone = 'default' | 'warning' | 'danger';

type Kpi = {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
};

const TONE_CLASSES: Record<Tone, string> = {
  default: 'text-foreground',
  warning: 'text-amber-700',
  danger: 'text-red-700',
};

function KpiCard({ kpi, isLoading }: { kpi: Kpi; isLoading?: boolean }) {
  const Icon = kpi.icon;
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="rounded-md bg-muted p-2">
          <Icon className={cn('size-4', TONE_CLASSES[kpi.tone])} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">{kpi.label}</p>
          {isLoading ? (
            <div className="mt-1 h-6 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className={cn('truncate text-xl font-semibold', TONE_CLASSES[kpi.tone])}>
              {kpi.value}
            </p>
          )}
          {kpi.subtitle && (
            <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  const kpis: Kpi[] = [
    {
      label: 'Total in stock',
      value: stats ? formatNumber(stats.total) : '—',
      icon: Boxes,
      tone: 'default',
    },
    {
      label: 'Aging',
      value: stats ? formatNumber(stats.agingCount) : '—',
      subtitle:
        stats && stats.uncoveredAgingCount > 0
          ? `${stats.uncoveredAgingCount} need attention`
          : stats && stats.agingCount > 0
            ? 'all have actions'
            : undefined,
      icon: AlertTriangle,
      tone: stats && stats.agingCount > 0 ? 'danger' : 'default',
    },
    {
      label: 'Aging value',
      value: stats ? formatCompactCurrency(stats.agingValue) : '—',
      icon: DollarSign,
      tone: stats && stats.agingValue > 0 ? 'warning' : 'default',
    },
    {
      label: 'Avg days in stock',
      value: stats ? `${stats.avgDaysInStock}d` : '—',
      icon: Clock,
      tone: 'default',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} kpi={kpi} isLoading={isLoading} />
      ))}
    </div>
  );
}
