import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addAction } from '@/lib/api/inventory';
import type { AddActionRequest, GetInventoryResponse } from '@/types/api';
import type { ActionLog } from '@/types/action';
import { inventoryQueryKey } from './useInventory';
import { nowIsoUtc } from '@/lib/utils/date';

type Variables = {
  dealershipId: string;
  carId: string;
  payload: AddActionRequest;
};

type Context = {
  previous?: GetInventoryResponse;
  tempId: string;
};

function applyTempLog(
  data: GetInventoryResponse,
  carId: string,
  tempLog: ActionLog
): GetInventoryResponse {
  return {
    ...data,
    cars: data.cars.map((car) =>
      car.id === carId ? { ...car, actionLogs: [...car.actionLogs, tempLog] } : car
    ),
  };
}

function replaceTempLog(
  data: GetInventoryResponse,
  carId: string,
  tempId: string,
  saved: ActionLog
): GetInventoryResponse {
  return {
    ...data,
    cars: data.cars.map((car) =>
      car.id === carId
        ? {
            ...car,
            actionLogs: car.actionLogs.map((log) => (log.id === tempId ? saved : log)),
          }
        : car
    ),
  };
}

export function useAddAction() {
  const queryClient = useQueryClient();

  return useMutation<ActionLog, Error, Variables, Context>({
    mutationFn: ({ dealershipId, carId, payload }) =>
      addAction(dealershipId, carId, payload),

    onMutate: async ({ dealershipId, carId, payload }) => {
      const key = inventoryQueryKey(dealershipId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<GetInventoryResponse>(key);
      const tempId = `temp-${crypto.randomUUID()}`;
      const tempLog: ActionLog = {
        id: tempId,
        carId,
        type: payload.type,
        note: payload.note,
        createdAt: nowIsoUtc(),
        createdBy: 'manager-001',
      };

      if (previous) {
        queryClient.setQueryData<GetInventoryResponse>(
          key,
          applyTempLog(previous, carId, tempLog)
        );
      }

      return { previous, tempId };
    },

    onError: (_err, { dealershipId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(inventoryQueryKey(dealershipId), context.previous);
      }
    },

    onSuccess: (saved, { dealershipId, carId }, context) => {
      const key = inventoryQueryKey(dealershipId);
      const current = queryClient.getQueryData<GetInventoryResponse>(key);
      if (current && context) {
        queryClient.setQueryData<GetInventoryResponse>(
          key,
          replaceTempLog(current, carId, context.tempId, saved)
        );
      }
    },

    onSettled: (_data, _error, { dealershipId }) => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKey(dealershipId) });
    },
  });
}
