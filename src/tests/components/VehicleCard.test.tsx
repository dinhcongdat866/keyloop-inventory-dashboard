import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VehicleCard } from '@/components/VehicleCard';
import type { EnrichedCar } from '@/types/aging';

function makeCar(overrides: Partial<EnrichedCar> = {}): EnrichedCar {
  return {
    id: 'car-001',
    vin: 'VIN0000000000001',
    make: 'Toyota',
    model: 'Camry',
    year: 2024,
    trim: undefined,
    condition: 'NEW',
    price: 35_000_00,
    mileage: 12,
    color: 'White',
    importedDate: '2025-01-01T00:00:00Z',
    dealershipId: 'dealer-001',
    actionLogs: [],
    daysInStock: 30,
    agingTier: 'HEALTHY',
    hasActions: false,
    latestAction: undefined,
    ...overrides,
  };
}

describe('VehicleCard', () => {
  let onOpenActions: (carId: string) => void;

  beforeEach(() => {
    onOpenActions = vi.fn();
  });

  it('renders year, make and model', () => {
    render(<VehicleCard car={makeCar()} onOpenActions={onOpenActions} />);
    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Camry/)).toBeInTheDocument();
  });

  it('shows "Aging" badge text for AGING tier', () => {
    render(<VehicleCard car={makeCar({ agingTier: 'AGING', daysInStock: 95 })} onOpenActions={onOpenActions} />);
    expect(screen.getByLabelText(/Aging — 95 days in stock/i)).toBeInTheDocument();
  });

  it('shows "Critical" badge text for CRITICAL tier', () => {
    render(<VehicleCard car={makeCar({ agingTier: 'CRITICAL', daysInStock: 130 })} onOpenActions={onOpenActions} />);
    expect(screen.getByLabelText(/Critical — 130 days in stock/i)).toBeInTheDocument();
  });

  it('does not render AlertTriangle icon for HEALTHY tier', () => {
    render(<VehicleCard car={makeCar({ agingTier: 'HEALTHY' })} onOpenActions={onOpenActions} />);
    const badge = screen.getByLabelText(/Healthy/i);
    expect(badge.querySelector('svg')).toBeNull();
  });

  it('highlights matching VIN substring with <mark> element', () => {
    const { container } = render(
      <VehicleCard
        car={makeCar({ vin: 'VIN0000ABC000001' })}
        onOpenActions={onOpenActions}
        searchTerm="abc"
      />
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0]).toHaveTextContent(/abc/i);
  });

  it('highlights matching trim substring with <mark> element', () => {
    const { container } = render(
      <VehicleCard
        car={makeCar({ trim: 'XLE' })}
        onOpenActions={onOpenActions}
        searchTerm="xle"
      />
    );
    const marks = container.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0]).toHaveTextContent(/xle/i);
  });

  it('does not highlight make/model — they are filtered via MultiSelect, not search', () => {
    const { container } = render(
      <VehicleCard car={makeCar()} onOpenActions={onOpenActions} searchTerm="toyota" />
    );
    expect(container.querySelectorAll('mark')).toHaveLength(0);
  });

  it('does not render <mark> when no search term', () => {
    const { container } = render(<VehicleCard car={makeCar()} onOpenActions={onOpenActions} />);
    expect(container.querySelectorAll('mark')).toHaveLength(0);
  });

  it('calls onOpenActions with car id when button is clicked', async () => {
    render(<VehicleCard car={makeCar({ id: 'car-042' })} onOpenActions={onOpenActions} />);
    await userEvent.click(screen.getByRole('button', { name: /add action/i }));
    expect(onOpenActions).toHaveBeenCalledOnce();
    expect(onOpenActions).toHaveBeenCalledWith('car-042');
  });

  it('shows "No action logged" when car has no actions', () => {
    render(<VehicleCard car={makeCar({ hasActions: false, actionLogs: [], latestAction: undefined })} onOpenActions={onOpenActions} />);
    expect(screen.getByText(/no action logged/i)).toBeInTheDocument();
  });

  it('shows "View (N)" button when car has actions', () => {
    const car = makeCar({
      hasActions: true,
      actionLogs: [
        { id: 'l1', carId: 'car-001', type: 'PRICE_REDUCTION_PLANNED', createdAt: '2025-10-01T00:00:00Z', createdBy: 'manager-001' },
        { id: 'l2', carId: 'car-001', type: 'TRANSFER_TO_BRANCH', createdAt: '2025-11-01T00:00:00Z', createdBy: 'manager-001' },
      ],
      latestAction: { id: 'l2', carId: 'car-001', type: 'TRANSFER_TO_BRANCH', createdAt: '2025-11-01T00:00:00Z', createdBy: 'manager-001' },
    });
    render(<VehicleCard car={car} onOpenActions={onOpenActions} />);
    expect(screen.getByRole('button', { name: /view \(2\)/i })).toBeInTheDocument();
    expect(screen.getByText(/transfer to branch/i)).toBeInTheDocument();
  });
});
