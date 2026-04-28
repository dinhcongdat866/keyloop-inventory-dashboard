import type { Car } from './vehicle';
import type { ActionLog, ActionType } from './action';

export type GetInventoryResponse = {
  dealershipId: string;
  dealershipName: string;
  cars: Car[];
  fetchedAt: string;
};

export type AddActionRequest = {
  type: ActionType;
  note?: string;
};

export type AddActionResponse = ActionLog;

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
