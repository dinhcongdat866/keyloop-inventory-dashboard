import { http, HttpResponse, delay } from 'msw';
import type { Car } from '@/types/vehicle';
import type { ActionLog } from '@/types/action';
import type {
  AddActionRequest,
  AddActionResponse,
  ApiError,
  GetInventoryResponse,
} from '@/types/api';
import { SEED_DEALERSHIP, generateSeedCars } from './seed';
import { appendPersistedLog, getPersistedLogs } from './storage';
import { nowIsoUtc } from '@/lib/utils/date';

const SEED_CARS: Car[] = generateSeedCars();
const carById = new Map(SEED_CARS.map((c) => [c.id, c]));

function mergeLogs(car: Car): Car {
  const persisted = getPersistedLogs(car.id);
  if (persisted.length === 0) return car;
  return { ...car, actionLogs: [...car.actionLogs, ...persisted] };
}

function err(status: number, code: string, message: string) {
  const body: ApiError = { code, message };
  return HttpResponse.json(body, { status });
}

export const handlers = [
  http.get('/api/dealerships/:dealershipId/inventory', async ({ params }) => {
    await delay(150);
    const { dealershipId } = params as { dealershipId: string };

    if (dealershipId !== SEED_DEALERSHIP.id) {
      return err(404, 'DEALERSHIP_NOT_FOUND', `Dealership ${dealershipId} not found`);
    }

    const cars = SEED_CARS.map(mergeLogs);
    const body: GetInventoryResponse = {
      dealershipId: SEED_DEALERSHIP.id,
      dealershipName: SEED_DEALERSHIP.name,
      cars,
      fetchedAt: nowIsoUtc(),
    };
    return HttpResponse.json(body);
  }),

  http.post(
    '/api/dealerships/:dealershipId/cars/:carId/actions',
    async ({ params, request }) => {
      await delay(200);
      const { dealershipId, carId } = params as { dealershipId: string; carId: string };

      if (dealershipId !== SEED_DEALERSHIP.id) {
        return err(404, 'DEALERSHIP_NOT_FOUND', `Dealership ${dealershipId} not found`);
      }
      if (!carById.has(carId)) {
        return err(404, 'CAR_NOT_FOUND', `Car ${carId} not found`);
      }

      let payload: AddActionRequest;
      try {
        payload = (await request.json()) as AddActionRequest;
      } catch {
        return err(400, 'INVALID_BODY', 'Request body must be valid JSON');
      }

      if (!payload?.type) {
        return err(400, 'INVALID_BODY', 'Field "type" is required');
      }

      const log: ActionLog = {
        id: `log-${crypto.randomUUID()}`,
        carId,
        type: payload.type,
        note: payload.note?.trim() || undefined,
        createdAt: nowIsoUtc(),
        createdBy: 'manager-001',
      };
      appendPersistedLog(log);

      const body: AddActionResponse = log;
      return HttpResponse.json(body, { status: 201 });
    }
  ),
];
