import { LEVELS, LEVEL_LABELS } from '../levels';
import type { LogEntry } from '../types';

export type FileFormat = 'json' | 'text';

// ─── Shared serialization used by file / stream transports ───────────────────

function serializeValue(val: unknown): string {
  if (val instanceof Error) return val.message;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    try { return JSON.stringify(val); } catch { return '[Circular]'; }
  }
  return String(val);
}

/**
 * Serialize a log entry to a single-line JSON string.
 * Schema is compatible with Pino / Datadog / Loki ingest formats.
 */
export function toJsonLine(entry: LogEntry): string {
  return JSON.stringify({
    level:     LEVELS[entry.level],
    levelName: entry.level,
    time:      entry.timestamp.toISOString(),
    namespace: entry.namespace,
    msg:       entry.msg,
    ...entry.fields,
  });
}

/** Serialize a log entry to a human-readable text line (no ANSI). */
export function toTextLine(entry: LogEntry): string {
  const h  = String(entry.timestamp.getHours()).padStart(2, '0');
  const m  = String(entry.timestamp.getMinutes()).padStart(2, '0');
  const s  = String(entry.timestamp.getSeconds()).padStart(2, '0');
  const ms = String(entry.timestamp.getMilliseconds()).padStart(3, '0');

  const fields = Object.entries(entry.fields)
    .map(([k, v]) => `${k}=${serializeValue(v)}`)
    .join(' ');

  return [
    `${h}:${m}:${s}.${ms}`,
    LEVEL_LABELS[entry.level],
    `[${entry.namespace}]`,
    entry.msg,
    fields,
  ].filter(Boolean).join('  ');
}

export function toLine(entry: LogEntry, format: FileFormat): string {
  return format === 'json' ? toJsonLine(entry) : toTextLine(entry);
}
