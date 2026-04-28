export type ActionType =
  | 'PRICE_REDUCTION_PLANNED'
  | 'PRICE_REDUCTION_APPLIED'
  | 'TRANSFER_TO_BRANCH'
  | 'SEND_TO_AUCTION'
  | 'PROMOTIONAL_CAMPAIGN'
  | 'RESERVED_FOR_CUSTOMER'
  | 'OTHER';

export type ActionLog = {
  id: string;
  carId: string;
  type: ActionType;
  note?: string;
  createdAt: string;
  createdBy: string;
};
