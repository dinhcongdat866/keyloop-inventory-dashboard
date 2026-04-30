import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FiltersBar } from '@/components/FiltersBar';
import type { FilterState } from '@/types/filters';
import type { EnrichedCar } from '@/types/aging';

const CLEAN_FILTERS: FilterState = {
  search: '',
  makes: [],
  models: [],
  years: [],
  agingOnly: false,
  hasActionsOnly: null,
  sortBy: 'AGING_PRIORITY',
};

const EMPTY_INVENTORY: EnrichedCar[] = [];

function renderBar(
  filterOverrides: Partial<FilterState> = {},
  { resultCount = 10, totalCount = 20 } = {}
) {
  const onChange = vi.fn();
  const onClear = vi.fn();
  render(
    <FiltersBar
      filters={{ ...CLEAN_FILTERS, ...filterOverrides }}
      onChange={onChange}
      onClear={onClear}
      inventory={EMPTY_INVENTORY}
      resultCount={resultCount}
      totalCount={totalCount}
    />
  );
  return { onChange, onClear };
}

describe('FiltersBar', () => {
  it('displays result count correctly', () => {
    renderBar({}, { resultCount: 42, totalCount: 250 });
    // resultCount is in its own <span>; totalCount is inline text in the <p>
    expect(screen.getByText('42')).toBeInTheDocument();
    const summary = screen.getByText(/Showing/i);
    expect(summary.textContent).toContain('250');
  });

  it('does not show Clear button when filters are clean', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
  });

  it('shows Clear button when search is active', () => {
    renderBar({ search: 'toyota' });
    expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument();
  });

  it('shows Clear button when agingOnly is active', () => {
    renderBar({ agingOnly: true });
    expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument();
  });

  it('calls onClear when Clear button is clicked', async () => {
    const { onClear } = renderBar({ search: 'toyota' });
    await userEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('renders search input', () => {
    renderBar();
    expect(screen.getByRole('searchbox', { name: /search inventory/i })).toBeInTheDocument();
  });

  it('renders "Aging only" checkbox label', () => {
    renderBar();
    expect(screen.getByText(/aging only/i)).toBeInTheDocument();
  });
});
