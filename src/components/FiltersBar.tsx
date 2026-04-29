import { useMemo } from 'react';
import type { EnrichedCar } from '@/types/aging';
import type { FilterState, SortKey } from '@/types/filters';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchInput } from './SearchInput';
import { MultiSelectFilter } from './MultiSelectFilter';
import { DaysRangeFilter } from './DaysRangeFilter';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'AGING_PRIORITY', label: 'Aging priority' },
  { value: 'DAYS_DESC', label: 'Days in stock (high → low)' },
  { value: 'DAYS_ASC', label: 'Days in stock (low → high)' },
  { value: 'PRICE_DESC', label: 'Price (high → low)' },
  { value: 'PRICE_ASC', label: 'Price (low → high)' },
  { value: 'RECENT_ACTION', label: 'Recently actioned' },
];

const HAS_ACTIONS_OPTIONS: { value: string; label: string }[] = [
  { value: 'any', label: 'Any actions' },
  { value: 'with', label: 'With actions' },
  { value: 'without', label: 'Without actions' },
];

type FiltersBarProps = {
  filters: FilterState;
  onChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClear: () => void;
  inventory: EnrichedCar[];
  resultCount: number;
  totalCount: number;
};

function isFiltersDirty(f: FilterState): boolean {
  return (
    f.search !== '' ||
    f.makes.length > 0 ||
    f.models.length > 0 ||
    f.years.length > 0 ||
    f.daysInStockMin !== undefined ||
    f.daysInStockMax !== undefined ||
    f.agingOnly ||
    f.hasActionsOnly !== null
  );
}

export function FiltersBar({
  filters,
  onChange,
  onClear,
  inventory,
  resultCount,
  totalCount,
}: FiltersBarProps) {
  // Derive available options from current inventory
  const makeOptions = useMemo(
    () =>
      [...new Set(inventory.map((c) => c.make))]
        .sort()
        .map((m) => ({ value: m, label: m })),
    [inventory]
  );

  const modelOptions = useMemo(() => {
    const filtered =
      filters.makes.length > 0
        ? inventory.filter((c) => filters.makes.includes(c.make))
        : inventory;
    return [...new Set(filtered.map((c) => c.model))]
      .sort()
      .map((m) => ({ value: m, label: m }));
  }, [inventory, filters.makes]);

  const yearOptions = useMemo(
    () =>
      [...new Set(inventory.map((c) => c.year))]
        .sort((a, b) => b - a)
        .map((y) => ({ value: y, label: String(y) })),
    [inventory]
  );

  const dirty = isFiltersDirty(filters);

  const hasActionsValue: string =
    filters.hasActionsOnly === null ? 'any' : filters.hasActionsOnly ? 'with' : 'without';

  return (
    <section className="space-y-3 rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.search}
          onChange={(v) => onChange('search', v)}
        />

        <MultiSelectFilter
          label="Make"
          options={makeOptions}
          selected={filters.makes}
          onChange={(v) => onChange('makes', v)}
        />

        <MultiSelectFilter
          label="Model"
          options={modelOptions}
          selected={filters.models}
          onChange={(v) => onChange('models', v)}
        />

        <MultiSelectFilter<number>
          label="Year"
          options={yearOptions}
          selected={filters.years}
          onChange={(v) => onChange('years', v)}
        />

        <DaysRangeFilter
          min={filters.daysInStockMin}
          max={filters.daysInStockMax}
          onChange={({ min, max }) => {
            onChange('daysInStockMin', min);
            onChange('daysInStockMax', max);
          }}
        />

        <Select
          value={hasActionsValue}
          onValueChange={(v) => {
            onChange(
              'hasActionsOnly',
              v === 'with' ? true : v === 'without' ? false : null
            );
          }}
        >
          <SelectTrigger size="sm" className="h-8 w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HAS_ACTIONS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label className="flex cursor-pointer items-center gap-1.5 text-sm">
          <Checkbox
            checked={filters.agingOnly}
            onCheckedChange={(v) => onChange('agingOnly', v === true)}
          />
          Aging only
        </Label>

        {dirty && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm">
        <p className="text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of{' '}
          {totalCount}
        </p>
        <div className="flex items-center gap-2">
          <Label className="text-xs whitespace-nowrap text-muted-foreground">Sort</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => onChange('sortBy', v as SortKey)}
          >
            <SelectTrigger size="sm" className="h-8 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
