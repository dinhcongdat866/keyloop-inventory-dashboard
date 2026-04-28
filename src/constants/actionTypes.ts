import type { ActionType } from '@/types/action';

type ActionTypeMeta = {
  label: string;
  description: string;
};

export const ACTION_TYPE_META: Record<ActionType, ActionTypeMeta> = {
  PRICE_REDUCTION_PLANNED: {
    label: 'Price Reduction Planned',
    description: 'Decision to lower the asking price',
  },
  PRICE_REDUCTION_APPLIED: {
    label: 'Price Reduced',
    description: 'Price has been adjusted',
  },
  TRANSFER_TO_BRANCH: {
    label: 'Transfer to Branch',
    description: 'Move vehicle to another branch',
  },
  SEND_TO_AUCTION: {
    label: 'Send to Auction',
    description: 'Wholesale through auction channel',
  },
  PROMOTIONAL_CAMPAIGN: {
    label: 'Promotional Campaign',
    description: 'Include in marketing promotion',
  },
  RESERVED_FOR_CUSTOMER: {
    label: 'Reserved for Customer',
    description: 'Held for a specific buyer',
  },
  OTHER: {
    label: 'Other',
    description: 'Free-form note',
  },
};

export const ACTION_TYPES: ActionType[] = Object.keys(ACTION_TYPE_META) as ActionType[];
