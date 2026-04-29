import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DaysRangeFilterProps = {
  min?: number;
  max?: number;
  onChange: (range: { min?: number; max?: number }) => void;
};

function parseInput(value: string): number | undefined {
  if (value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function DaysRangeFilter({ min, max, onChange }: DaysRangeFilterProps) {
  return (
    <fieldset className="flex items-center gap-2">
      <Label className="text-xs whitespace-nowrap text-muted-foreground">Days</Label>
      <Input
        type="number"
        min={0}
        placeholder="min"
        value={min ?? ''}
        onChange={(e) => onChange({ min: parseInput(e.target.value), max })}
        className="h-7 w-16"
        aria-label="Minimum days in stock"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        type="number"
        min={0}
        placeholder="max"
        value={max ?? ''}
        onChange={(e) => onChange({ min, max: parseInput(e.target.value) })}
        className="h-7 w-16"
        aria-label="Maximum days in stock"
      />
    </fieldset>
  );
}
