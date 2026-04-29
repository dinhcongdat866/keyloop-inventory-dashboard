import { useEffect, useState } from 'react';

const HOUR_MS = 60 * 60 * 1000;

function startOfDayIsoUtc(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

/**
 * Returns "today" anchor (start of day, UTC ISO) that updates when the tab
 * regains visibility/focus or every hour. Used so derived values like
 * `daysInStock` re-compute after long-idle sessions.
 */
export function useToday(): string {
  const [today, setToday] = useState(startOfDayIsoUtc());

  useEffect(() => {
    const update = () => setToday(startOfDayIsoUtc());
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    const interval = setInterval(update, HOUR_MS);
    return () => {
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
      clearInterval(interval);
    };
  }, []);

  return today;
}
