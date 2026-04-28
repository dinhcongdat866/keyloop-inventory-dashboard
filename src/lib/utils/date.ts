const MS_PER_DAY = 86_400_000;

export function toIsoUtc(date: Date): string {
  return date.toISOString();
}

export function daysBetweenUtc(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.floor((to - from) / MS_PER_DAY));
}

export function nowIsoUtc(): string {
  return new Date().toISOString();
}

export function daysAgoIsoUtc(days: number, base: Date = new Date()): string {
  return new Date(base.getTime() - days * MS_PER_DAY).toISOString();
}
