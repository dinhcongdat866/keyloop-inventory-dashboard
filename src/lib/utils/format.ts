const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-US');

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatCompactCurrency(cents: number): string {
  return compactCurrencyFormatter.format(cents / 100);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDays(days: number): string {
  return `${days}d`;
}
