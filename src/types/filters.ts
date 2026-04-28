export type SortKey =
  | 'AGING_PRIORITY'
  | 'DAYS_DESC'
  | 'DAYS_ASC'
  | 'PRICE_DESC'
  | 'PRICE_ASC'
  | 'RECENT_ACTION';

export type FilterState = {
  search: string;
  makes: string[];
  models: string[];
  years: number[];
  daysInStockMin?: number;
  daysInStockMax?: number;
  agingOnly: boolean;
  hasActionsOnly: boolean | null;
  sortBy: SortKey;
};
