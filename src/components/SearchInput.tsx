import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search VIN, make, model, trim…',
  debounceMs,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const debounced = useDebouncedValue(local, debounceMs);

  // Reset local when external value clears (e.g. "clear filters")
  if (prevValue !== value) {
    setPrevValue(value);
    if (value === '') setLocal('');
  }

  // Push debounced changes upstream
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative w-full md:max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label="Search inventory"
      />
      {local && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setLocal('')}
          aria-label="Clear search"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
