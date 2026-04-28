import type { ActionLog } from '@/types/action';

const ACTION_LOGS_KEY = 'keyloop:mock:action-logs';

type LogsByCar = Record<string, ActionLog[]>;

function safeParse(raw: string | null): LogsByCar {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as LogsByCar;
    return {};
  } catch {
    return {};
  }
}

function readAll(): LogsByCar {
  if (typeof localStorage === 'undefined') return {};
  return safeParse(localStorage.getItem(ACTION_LOGS_KEY));
}

function writeAll(data: LogsByCar): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACTION_LOGS_KEY, JSON.stringify(data));
}

export function getPersistedLogs(carId: string): ActionLog[] {
  const all = readAll();
  return all[carId] ?? [];
}

export function appendPersistedLog(log: ActionLog): void {
  const all = readAll();
  const list = all[log.carId] ?? [];
  list.push(log);
  all[log.carId] = list;
  writeAll(all);
}

export function clearPersistedLogs(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(ACTION_LOGS_KEY);
}
