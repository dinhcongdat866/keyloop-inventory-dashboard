import type { Car, VehicleCondition } from '@/types/vehicle';
import type { ActionLog, ActionType } from '@/types/action';
import { daysAgoIsoUtc } from '@/lib/utils/date';

const SEED = 0x1a2b3c4d;
const DEALERSHIP_ID = 'dealer-001';
const DEALERSHIP_NAME = 'Toyota of Hanoi';

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(SEED);

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]!;
}

function pickWeighted<T>(items: readonly { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randomVin(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) vin += chars[Math.floor(rand() * chars.length)];
  return vin;
}

const MAKES_MODELS: Record<string, { models: string[]; trims: string[] }> = {
  Toyota: { models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'], trims: ['LE', 'SE', 'XLE', 'XSE', 'Limited'] },
  Honda:  { models: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],      trims: ['LX', 'EX', 'EX-L', 'Touring'] },
  Ford:   { models: ['F-150', 'Escape', 'Explorer', 'Mustang', 'Bronco'], trims: ['XL', 'XLT', 'Lariat', 'Platinum'] },
  BMW:    { models: ['3 Series', '5 Series', 'X3', 'X5'],                  trims: ['Sport', 'M Sport', 'Luxury'] },
  Mazda:  { models: ['CX-5', 'Mazda3', 'CX-30'],                           trims: ['Sport', 'Touring', 'Grand Touring'] },
};

const MAKE_WEIGHTS = [
  { value: 'Toyota', weight: 40 },
  { value: 'Honda',  weight: 25 },
  { value: 'Ford',   weight: 20 },
  { value: 'BMW',    weight: 10 },
  { value: 'Mazda',  weight: 5 },
];

const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red'];
const CONDITIONS: VehicleCondition[] = ['NEW', 'NEW', 'NEW', 'USED', 'CERTIFIED_PRE_OWNED'];

const AGE_BUCKETS = [
  { weight: 70, range: [0, 60] as const },
  { weight: 15, range: [61, 90] as const },
  { weight: 12, range: [91, 120] as const },
  { weight: 3,  range: [121, 220] as const },
];

function pickDaysInStock(): number {
  const bucket = pickWeighted(AGE_BUCKETS.map((b) => ({ value: b.range, weight: b.weight })));
  return randInt(bucket[0], bucket[1]);
}

const SEED_ACTION_TYPES: ActionType[] = [
  'PRICE_REDUCTION_PLANNED',
  'TRANSFER_TO_BRANCH',
  'PROMOTIONAL_CAMPAIGN',
];

function buildSeedActionLogs(carId: string, importedDate: string): ActionLog[] {
  if (rand() > 0.4) return [];
  const count = rand() > 0.7 ? 2 : 1;
  const logs: ActionLog[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = randInt(1, 14);
    logs.push({
      id: `log-seed-${carId}-${i}`,
      carId,
      type: pick(SEED_ACTION_TYPES),
      note: undefined,
      createdAt: daysAgoIsoUtc(daysAgo),
      createdBy: 'manager-001',
    });
  }
  logs.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  void importedDate;
  return logs;
}

function buildCar(index: number): Car {
  const make = pickWeighted(MAKE_WEIGHTS);
  const { models, trims } = MAKES_MODELS[make]!;
  const model = pick(models);
  const trim = pick(trims);
  const year = randInt(2022, 2025);
  const condition = pick(CONDITIONS);
  const daysInStock = pickDaysInStock();
  const importedDate = daysAgoIsoUtc(daysInStock);
  const id = `car-${String(index).padStart(4, '0')}`;
  const isAging = daysInStock > 90;
  const seedLogs = isAging ? buildSeedActionLogs(id, importedDate) : [];

  return {
    id,
    vin: randomVin(),
    make,
    model,
    year,
    trim,
    condition,
    price: randInt(20_000, 80_000) * 100,
    mileage: condition === 'NEW' ? randInt(0, 50) : randInt(5_000, 60_000),
    color: pick(COLORS),
    importedDate,
    dealershipId: DEALERSHIP_ID,
    actionLogs: seedLogs,
  };
}

export const SEED_DEALERSHIP = {
  id: DEALERSHIP_ID,
  name: DEALERSHIP_NAME,
};

export function generateSeedCars(count = 250): Car[] {
  return Array.from({ length: count }, (_, i) => buildCar(i));
}
