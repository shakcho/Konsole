import type { LogEntry } from './types';

/** Sentinel value written in place of redacted fields. */
export const REDACTED = '[REDACTED]';

/**
 * Pre-compile dot-notation path strings into segment arrays.
 * Call once at construction time so `'req.headers.authorization'.split('.')` is
 * not repeated on every log entry.
 *
 * @example
 * compileRedactPaths(['password', 'req.headers.authorization'])
 * // → [['password'], ['req', 'headers', 'authorization']]
 */
export function compileRedactPaths(paths: string[]): string[][] {
  return paths.map((p) => p.split('.'));
}

/**
 * Return a new `LogEntry` with sensitive field values replaced by `'[REDACTED]'`.
 *
 * - Only `entry.fields` is inspected; `entry.msg` is never modified.
 * - The original entry and its nested objects are **never mutated** — only
 *   the objects along each redacted path are shallow-cloned.
 * - Non-existent paths are silently ignored.
 * - Arrays and `Error` instances encountered mid-path terminate the walk
 *   without modification.
 * - When `paths` is empty the original entry is returned unchanged (fast-path).
 */
export function applyRedaction(entry: LogEntry, paths: string[][]): LogEntry {
  if (paths.length === 0) return entry;

  const fields = { ...entry.fields };

  for (const segments of paths) {
    redactAtPath(fields, segments, 0);
  }

  return { ...entry, fields };
}

/**
 * Recursively walk `obj` along `segments[depth..]` and replace the terminal
 * value with `REDACTED`.  Intermediate objects are shallow-cloned in-place on
 * `obj` so that the original object graph is not mutated.
 */
function redactAtPath(
  obj: Record<string, unknown>,
  segments: string[],
  depth: number,
): void {
  const key = segments[depth];
  if (!(key in obj)) return;

  if (depth === segments.length - 1) {
    obj[key] = REDACTED;
    return;
  }

  const child = obj[key];
  if (
    child !== null &&
    typeof child === 'object' &&
    !Array.isArray(child) &&
    !(child instanceof Error)
  ) {
    const cloned = { ...(child as Record<string, unknown>) };
    obj[key] = cloned;
    redactAtPath(cloned, segments, depth + 1);
  }
  // Primitives, arrays, Errors, and null: walk terminates, value left as-is.
}
