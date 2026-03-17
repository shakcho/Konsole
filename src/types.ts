import type { LogLevelName } from './levels';
import type { KonsoleFormat } from './formatter';

/**
 * Represents a single log entry stored in the circular buffer.
 */
export type LogEntry = {
  /** Primary log message (extracted from the first string argument). */
  msg: string;
  /** All original arguments passed to the log method (kept for backward compatibility). */
  messages: unknown[];
  /** Structured key-value fields merged from the call arguments. */
  fields: Record<string, unknown>;
  timestamp: Date;
  namespace: string;
  level: LogLevelName;
  levelValue: number;
  /** @deprecated Use `level` instead. */
  logtype?: string;
};

/**
 * Wire-format for worker postMessage — timestamps are ISO strings, objects are pre-serialized.
 */
export type SerializableLogEntry = {
  msg: string;
  messages: unknown[];
  fields: Record<string, unknown>;
  timestamp: string;
  namespace: string;
  level: LogLevelName;
  levelValue: number;
  /** @deprecated */
  logtype?: string;
};

/**
 * Fine-grained output filter. Prefer `level` for simple threshold filtering.
 * @deprecated Boolean criteria will be removed in a future version. Use `level` or `format: 'silent'`.
 */
export type Criteria = boolean | ((logEntry: LogEntry) => boolean);

/**
 * Public interface for Konsole logger — safe to expose to untrusted code (e.g. via exposeToWindow).
 */
export interface KonsolePublic {
  viewLogs(batchSize?: number): void;
}

/**
 * Base interface all transport implementations must satisfy.
 *
 * A transport receives every log entry that passes the logger's level filter
 * and is responsible for delivering it to some destination (HTTP endpoint,
 * file, stdout, external stream, etc.).
 */
export interface Transport {
  /** Unique identifier used in logs and debug output. */
  readonly name: string;
  /** Called synchronously for each entry that passes all filters. */
  write(entry: LogEntry): void;
  /**
   * Flush any buffered entries.
   * Optional — implement only when the transport batches internally.
   */
  flush?(): Promise<void>;
  /** Flush and release all resources (timers, file handles, sockets). */
  destroy(): Promise<void>;
}

/**
 * Configuration for an HTTP transport that batches and ships logs to an external endpoint.
 */
export interface TransportConfig {
  /** Unique identifier for this transport */
  name: string;
  /** Endpoint URL to POST logs to */
  url: string;
  /** HTTP method (default: POST) */
  method?: 'POST' | 'PUT';
  /** Additional request headers */
  headers?: Record<string, string>;
  /** Number of entries to accumulate before flushing (default: 50) */
  batchSize?: number;
  /** Flush interval in ms (default: 10000) */
  flushInterval?: number;
  /** Retry attempts on failure with exponential backoff (default: 3) */
  retryAttempts?: number;
  /** Only send entries that pass this predicate */
  filter?: (entry: LogEntry) => boolean;
  /** Transform an entry before sending */
  transform?: (entry: LogEntry) => unknown;
  /**
   * Custom fetch implementation.
   * Required on Node.js < 18. Pass e.g. the default export of `node-fetch`.
   * Defaults to `globalThis.fetch`.
   */
  fetchImpl?: typeof fetch;
}

/**
 * Configuration options for a Konsole logger instance.
 */
export interface KonsoleOptions {
  /** Logger namespace shown in every output line (default: 'Global') */
  namespace?: string;

  /**
   * Minimum log level to process. Entries below this level are discarded
   * immediately — they are neither stored nor output.
   * @default 'trace' (all levels pass through)
   */
  level?: LogLevelName;

  /**
   * Output format.
   * - `'auto'`    — selects based on environment (default)
   * - `'pretty'`  — colorized, human-readable (Node.js TTY)
   * - `'json'`    — newline-delimited JSON (pipes / log aggregators)
   * - `'text'`    — plain text, no ANSI (CI / log files)
   * - `'browser'` — styled DevTools output via `%c`
   * - `'silent'`  — no output; logs are still stored in memory
   * @default 'auto'
   */
  format?: KonsoleFormat;

  /**
   * Fine-grained output filter or legacy silent flag.
   * @deprecated Boolean `false` — use `format: 'silent'` instead.
   *             Boolean `true`  — omit this option (auto-output is now the default).
   *             Function filter — still fully supported.
   */
  criteria?: Criteria;

  /** Default batch size for `viewLogs()` (default: 100) */
  defaultBatchSize?: number;
  /** How long to keep log entries in ms (default: 48 hours) */
  retentionPeriod?: number;
  /** How often to run the retention cleanup in ms (default: 1 hour) */
  cleanupInterval?: number;
  /** Maximum entries to keep in the circular buffer (default: 10000) */
  maxLogs?: number;
  /** Offload log storage to a Web Worker — browser only (default: false) */
  useWorker?: boolean;
  /**
   * Transports to forward log entries to external destinations.
   * Accepts both `TransportConfig` plain objects (auto-wrapped in `HttpTransport`)
   * and concrete `Transport` instances (`ConsoleTransport`, `FileTransport`, etc.).
   */
  transports?: (Transport | TransportConfig)[];
}

/**
 * Options accepted by `logger.child()`.
 */
export interface KonsoleChildOptions {
  /**
   * Override the namespace for this child logger.
   * Useful for labelling a subsystem: `logger.child({}, { namespace: 'App:DB' })`.
   * Defaults to the parent's namespace.
   */
  namespace?: string;
  /**
   * Override the minimum log level for this child.
   * Can only be equal to or more restrictive than the parent — a child cannot
   * log levels that the parent's buffer would discard.
   */
  level?: LogLevelName;
}

// ─── Worker message protocol ──────────────────────────────────────────────────

export type WorkerMessageType =
  | 'ADD_LOG'
  | 'GET_LOGS'
  | 'CLEAR_LOGS'
  | 'FLUSH_OLD'
  | 'CONFIGURE'
  | 'LOGS_RESPONSE'
  | 'FLUSH_TRANSPORT';

export interface WorkerMessage {
  type: WorkerMessageType;
  payload?: unknown;
  namespace?: string;
  requestId?: string;
}
