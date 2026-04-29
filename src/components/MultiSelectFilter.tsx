import { ChevronDown, X } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Option<T extends string | number> = {
  value: T;
  label: string;
};

type MultiSelectFilterProps<T extends string | number> = {
  label: string;
  options: Option<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  emptyText?: string;
};

export function MultiSelectFilter<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  emptyText = 'No options',
}: MultiSelectFilterProps<T>) {
  const isSelected = (val: T) => selected.includes(val);

  const toggle = (val: T) => {
    if (isSelected(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const triggerLabel =
    selected.length === 0
      ? label
      : selected.length === 1
        ? `${label}: ${options.find((o) => o.value === selected[0])?.label ?? selected[0]}`
        : `${label}: ${selected.length}`;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'justify-between gap-2',
          selected.length > 0 && 'border-primary'
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        {selected.length > 0 ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label} filter`}
            onClick={clear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') clear(e as unknown as React.MouseEvent);
            }}
            className="rounded-sm p-0.5 hover:bg-muted"
          >
            <X className="size-3" />
          </span>
        ) : (
          <ChevronDown className="size-3" />
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        {options.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {options.map((opt) => {
              const id = `${label}-${opt.value}`;
              return (
                <li key={String(opt.value)}>
                  <Label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-muted"
                  >
                    <Checkbox
                      id={id}
                      checked={isSelected(opt.value)}
                      onCheckedChange={() => toggle(opt.value)}
                    />
                    <span className="text-sm">{opt.label}</span>
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
