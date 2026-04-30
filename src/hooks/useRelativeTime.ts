import { useEffect, useState } from 'react';
import { formatDistanceStrict } from 'date-fns';

const JUST_NOW_THRESHOLD_MS = 5_000;

export function useRelativeTime(iso?: string, intervalMs = 10_000): string | null {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    const id = setInterval(tick, intervalMs);
    return () => {
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
      clearInterval(id);
    };
  }, [intervalMs]);

  if (!iso) return null;
  const target = new Date(iso);
  const delta = now.getTime() - target.getTime();
  if (delta < JUST_NOW_THRESHOLD_MS) return 'just now';
  return formatDistanceStrict(target, now, { addSuffix: true });
}
