import type {
  AddActionRequest,
  AddActionResponse,
  GetInventoryResponse,
} from '@/types/api';
import { apiFetch } from './client';

export function getInventory(dealershipId: string): Promise<GetInventoryResponse> {
  return apiFetch<GetInventoryResponse>(`/dealerships/${dealershipId}/inventory`);
}

export function addAction(
  dealershipId: string,
  carId: string,
  payload: AddActionRequest
): Promise<AddActionResponse> {
  return apiFetch<AddActionResponse>(
    `/dealerships/${dealershipId}/cars/${carId}/actions`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}
