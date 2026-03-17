export const LEVELS = {
  trace: 10,
  debug: 20,
  info:  30,
  warn:  40,
  error: 50,
  fatal: 60,
} as const;

export type LogLevelName  = keyof typeof LEVELS;
export type LogLevelValue = (typeof LEVELS)[LogLevelName];

/** 3-character uppercase badge shown in terminal output */
export const LEVEL_LABELS: Record<LogLevelName, string> = {
  trace: 'TRC',
  debug: 'DBG',
  info:  'INF',
  warn:  'WRN',
  error: 'ERR',
  fatal: 'FTL',
};

export function isValidLevel(level: string): level is LogLevelName {
  return level in LEVELS;
}
