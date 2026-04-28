import type { ActionLog } from './action';

export type VehicleCondition = 'NEW' | 'USED' | 'CERTIFIED_PRE_OWNED';

export type Car = {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  condition: VehicleCondition;

  price: number;
  mileage: number;
  color: string;

  importedDate: string;
  dealershipId: string;

  actionLogs: ActionLog[];
};
