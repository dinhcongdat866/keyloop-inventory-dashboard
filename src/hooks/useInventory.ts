import { useQuery } from '@tanstack/react-query';
import { getInventory } from '@/lib/api/inventory';

export const inventoryQueryKey = (dealershipId: string) =>
  ['inventory', dealershipId] as const;

const STALE_TIME_MS = 60_000;
const POLL_INTERVAL_MS = 60_000;

export function useInventory(dealershipId: string) {
  return useQuery({
    queryKey: inventoryQueryKey(dealershipId),
    queryFn: () => getInventory(dealershipId),
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
