type Level = 'debug' | 'info' | 'warn' | 'error';

function log(level: Level, message: string, context?: Record<string, unknown>): void {
  if (import.meta.env.MODE === 'test') return;
  const ts = new Date().toISOString().slice(11, 19);
  const line = `[${level.toUpperCase()}] ${ts} ${message}`;
  if (context !== undefined) {
    console[level](line, context);
  } else {
    console[level](line);
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => log('info',  msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => log('warn',  msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log('error', msg, ctx),
};
