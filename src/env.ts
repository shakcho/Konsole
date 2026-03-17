/**
 * Runtime environment detection utilities.
 * Use these instead of directly checking `window`, `process`, etc.
 */

export const isBrowser: boolean =
  typeof window !== 'undefined' && typeof document !== 'undefined';

export const isNode: boolean =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null;

/**
 * Returns true when stdout is a TTY (i.e. an interactive terminal).
 * Used to decide whether to enable pretty-printing by default.
 */
export function isTTY(): boolean {
  if (isNode) {
    return (process.stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY === true;
  }
  return false;
}

/**
 * Resolves the best available `fetch` implementation from the runtime.
 * Returns `undefined` when fetch is not natively available (Node < 18).
 */
export function getGlobalFetch(): typeof fetch | undefined {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis) as typeof fetch;
  }
  return undefined;
}
