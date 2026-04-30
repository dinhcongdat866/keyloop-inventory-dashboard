import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AddActionForm } from '@/components/AddActionForm';

const mockMutate = vi.fn();
const mockState = { isPending: false };

vi.mock('@/hooks/useAddAction', () => ({
  useAddAction: () => ({ mutate: mockMutate, isPending: mockState.isPending }),
}));

function renderForm(props: { onSuccess?: () => void } = {}) {
  return render(
    <AddActionForm dealershipId="dealer-001" carId="car-001" {...props} />
  );
}

describe('AddActionForm', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockState.isPending = false;
  });

  it('renders action type select and note textarea', () => {
    renderForm();
    expect(screen.getByLabelText(/action type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
  });

  it('submit button is enabled by default', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /save action/i })).toBeEnabled();
  });

  it('submit button is disabled and shows "Saving…" when isPending', () => {
    mockState.isPending = true;
    renderForm();
    const btn = screen.getByRole('button', { name: /saving/i });
    expect(btn).toBeDisabled();
  });

  it('calls mutate with correct dealershipId and carId on valid submit', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: /save action/i }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledOnce();
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          dealershipId: 'dealer-001',
          carId: 'car-001',
          payload: expect.objectContaining({ type: 'PRICE_REDUCTION_PLANNED' }),
        }),
        expect.any(Object)
      );
    });
  });

  it('shows validation error when note exceeds 500 characters', async () => {
    renderForm();
    const textarea = screen.getByLabelText(/note/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(501) } });
    await userEvent.click(screen.getByRole('button', { name: /save action/i }));
    await waitFor(() => {
      expect(screen.getByText(/500 characters/i)).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not show validation error for note within 500 characters', async () => {
    renderForm();
    const textarea = screen.getByLabelText(/note/i);
    fireEvent.change(textarea, { target: { value: 'a'.repeat(500) } });
    await userEvent.click(screen.getByRole('button', { name: /save action/i }));
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
    expect(screen.queryByText(/500 characters/i)).toBeNull();
  });
});
