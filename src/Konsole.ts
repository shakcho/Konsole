import { CircularBuffer } from './CircularBuffer';
import { HttpTransport } from './transports/HttpTransport';
import { LEVELS, type LogLevelName } from './levels';
import { createFormatter, type Formatter } from './formatter';
import type {
  LogEntry,
  Transport,
  SerializableLogEntry,
  Criteria,
  KonsolePublic,
  KonsoleOptions,
  KonsoleChildOptions,
  TransportConfig,
  WorkerMessage,
} from './types';

// Re-export types
export type { LogEntry, Transport, Criteria, KonsolePublic, KonsoleOptions, KonsoleChildOptions, TransportConfig };

/** Returns true when `t` is a plain `TransportConfig` object (not a Transport instance). */
function isTransportConfig(t: Transport | TransportConfig): t is TransportConfig {
  return typeof (t as TransportConfig).url === 'string';
}

/**
 * Konsole — a lightweight, namespaced logging library for browser and Node.js.
 *
 * @example
 * ```ts
 * import { Konsole } from 'konsole-logger';
 *
 * const logger = new Konsole({ namespace: 'API', level: 'info' });
 *
 * logger.info('Server started', { port: 3000 });
 * logger.error('Request failed', { err: new Error('timeout'), path: '/users' });
 * ```
 */
export class Konsole implements KonsolePublic {
  private static instances: Map<string, Konsole> = new Map();
  private static globalFlagName = '__KonsolePrintEnabled__';
  private static sharedWorker: Worker | null = null;
  private static workerPendingCallbacks: Map<string, (logs: LogEntry[]) => void> = new Map();

  private logs: CircularBuffer<LogEntry>;
  private namespace: string;
  private bindings: Record<string, unknown> = {};
  private criteria: Criteria;
  private formatter: Formatter;
  private minLevelValue: number;
  private defaultBatchSize: number;
  private currentBatchStart: number = 0;
  private retentionPeriod: number;
  private maxLogs: number;
  private cleanupIntervalId?: ReturnType<typeof setInterval>;
  private useWorker: boolean;
  private transports: Transport[] = []; // Transport interface from types.ts

  constructor(options: KonsoleOptions = {}) {
    const {
      namespace = 'Global',
      level = 'trace',
      format = 'auto',
      criteria = true,
      defaultBatchSize = 100,
      retentionPeriod = 48 * 60 * 60 * 1000, // 48 hours
      cleanupInterval = 60 * 60 * 1000,        // 1 hour
      maxLogs = 10000,
      useWorker = false,
      transports = [],
    } = options;

    this.namespace       = namespace;
    this.criteria        = criteria;
    this.minLevelValue   = LEVELS[level];
    this.formatter       = createFormatter(format);
    this.defaultBatchSize = defaultBatchSize;
    this.retentionPeriod = retentionPeriod;
    this.maxLogs         = maxLogs;
    this.useWorker       = useWorker && typeof Worker !== 'undefined';

    if (useWorker && !this.useWorker) {
      console.warn(
        '[Konsole] Web Worker is not available in this environment (useWorker ignored). ' +
        'In Node.js, offloaded worker processing is not yet supported.',
      );
    }

    this.logs = new CircularBuffer<LogEntry>(maxLogs);

    for (const t of transports) {
      this.transports.push(isTransportConfig(t) ? new HttpTransport(t) : t);
    }

    if (this.useWorker) {
      // Worker only supports HTTP transports — filter out custom Transport instances
      this.initWorker(transports.filter(isTransportConfig));
    }

    if (!this.useWorker) {
      this.cleanupIntervalId = setInterval(
        () => this.flushOldLogs(),
        cleanupInterval,
      );
    }

    Konsole.instances.set(namespace, this);
    this.initGlobalFlag();
  }

  // ─── Static API ────────────────────────────────────────────────────────────

  /** Retrieve an existing logger by namespace. Creates a new one if not found. */
  static getLogger(namespace: string = 'Global'): Konsole {
    const instance = Konsole.instances.get(namespace);
    if (!instance) {
      console.warn(`[Konsole] Logger with namespace "${namespace}" not found, creating a new one.`);
      return new Konsole({ namespace });
    }
    return instance;
  }

  /** Returns the list of all registered namespace names. */
  static getNamespaces(): string[] {
    return Array.from(Konsole.instances.keys());
  }

  /**
   * Exposes a `__Konsole` debug handle on `window` for use in browser DevTools.
   *
   * @example
   * ```js
   * // In browser console:
   * __Konsole.getLogger('Auth').viewLogs()
   * __Konsole.listLoggers()
   * __Konsole.enableAll()
   * ```
   */
  static exposeToWindow(): void {
    if (typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__Konsole = {
      getLogger: (namespace: string = 'Global'): KonsolePublic => {
        const logger = Konsole.getLogger(namespace);
        return { viewLogs: (batchSize?: number) => logger.viewLogs(batchSize) };
      },
      listLoggers: () => Array.from(Konsole.instances.keys()),
      enableAll:   () => Konsole.enableGlobalPrint(true),
      disableAll:  () => Konsole.enableGlobalPrint(false),
    };
  }

  /**
   * Globally override output for all loggers.
   * `true`  — forces all loggers to print regardless of their `level` / `criteria`.
   * `false` — restores normal per-logger rules (default).
   */
  static enableGlobalPrint(enabled: boolean): void {
    (globalThis as Record<string, unknown>)[Konsole.globalFlagName] = enabled;
  }

  /** Add an HTTP transport to every registered logger. */
  static addGlobalTransport(config: TransportConfig): void {
    Konsole.instances.forEach((instance) => instance.addTransport(config));
  }

  // ─── Child loggers ─────────────────────────────────────────────────────────

  /**
   * Creates a child logger that inherits this logger's config and prepends
   * `bindings` to every log entry it produces.
   *
   * Bindings accumulate through nested children. Call-site fields always win
   * over bindings on key collision.
   *
   * Children share the parent's circular buffer and formatter.
   * They are NOT registered in `Konsole.instances` — they are ephemeral.
   *
   * @example
   * ```ts
   * // Per-request logger
   * const req = logger.child({ requestId: 'abc', ip: '1.2.3.4' });
   * req.info('request started', { path: '/users' });
   * // → INF [App]  request started  requestId=abc ip=1.2.3.4 path=/users
   *
   * // Nested child — bindings accumulate
   * const db = req.child({ component: 'db' }, { namespace: 'App:DB' });
   * db.debug('query', { sql: 'SELECT...', ms: 4 });
   * // → DBG [App:DB]  query  requestId=abc ip=1.2.3.4 component=db sql="SELECT..." ms=4
   * ```
   */
  child(bindings: Record<string, unknown>, options?: KonsoleChildOptions): Konsole {
    return Konsole.createChild(this, bindings, options);
  }

  /**
   * Factory that bypasses the normal constructor to produce a child logger
   * that shares the parent's buffer, formatter, and transports.
   */
  private static createChild(
    parent: Konsole,
    bindings: Record<string, unknown>,
    options?: KonsoleChildOptions,
  ): Konsole {
    // Object.create skips the constructor — we set every field manually.
    const child = Object.create(Konsole.prototype) as Konsole;

    // ── Shared references (mutations in parent are visible in child and vice-versa) ──
    child.logs      = parent.logs;      // same circular buffer
    child.formatter = parent.formatter; // same output destination
    child.useWorker = parent.useWorker;

    // ── Separate array, same Transport instances (child.addTransport won't affect parent) ──
    child.transports = [...parent.transports];

    // ── Inherited scalar values (copied, not shared) ──
    child.criteria        = parent.criteria;
    child.defaultBatchSize = parent.defaultBatchSize;
    child.retentionPeriod = parent.retentionPeriod;
    child.maxLogs         = parent.maxLogs;

    // ── Overridable per-child values ──
    child.namespace     = options?.namespace ?? parent.namespace;
    child.minLevelValue = options?.level ? LEVELS[options.level] : parent.minLevelValue;

    // ── Child-own state ──
    child.bindings          = { ...parent.bindings, ...bindings }; // bindings accumulate
    child.currentBatchStart = 0;
    // No cleanupIntervalId — the root logger owns retention cleanup

    return child;
  }

  // ─── Logging methods ───────────────────────────────────────────────────────

  /** Level 10 — extremely verbose, disabled in most environments. */
  trace(...args: unknown[]): void { this.addLog('trace', args); }

  /** Level 20 — developer-facing detail, hidden at `level: 'info'` and above. */
  debug(...args: unknown[]): void { this.addLog('debug', args); }

  /** Level 30 — general informational messages. */
  info(...args: unknown[]): void { this.addLog('info', args); }

  /** Level 30 — alias for `info()` (backward compatibility). */
  log(...args: unknown[]): void { this.addLog('info', args); }

  /** Level 40 — something unexpected but recoverable. */
  warn(...args: unknown[]): void { this.addLog('warn', args); }

  /** Level 50 — an operation failed; written to stderr. */
  error(...args: unknown[]): void { this.addLog('error', args); }

  /** Level 60 — unrecoverable failure; written to stderr. */
  fatal(...args: unknown[]): void { this.addLog('fatal', args); }

  // ─── Instance management ───────────────────────────────────────────────────

  /** Update the minimum log level at runtime. */
  setLevel(level: LogLevelName): void {
    this.minLevelValue = LEVELS[level];
  }

  /** Update the fine-grained criteria filter. @deprecated Prefer `setLevel()`. */
  setCriteria(criteria: Criteria): void {
    this.criteria = criteria;
  }

  /**
   * Add a transport to this logger.
   * Accepts both a `TransportConfig` plain object (auto-wrapped in `HttpTransport`)
   * and a concrete `Transport` instance (`ConsoleTransport`, `FileTransport`, etc.).
   */
  addTransport(transport: Transport | TransportConfig): void {
    this.transports.push(isTransportConfig(transport) ? new HttpTransport(transport) : transport);
  }

  /** Flush all pending transport batches immediately. */
  async flushTransports(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.flush?.()));
  }

  // ─── Log retrieval ─────────────────────────────────────────────────────────

  /** Print stored logs in batches using `console.table`. Primarily a browser dev tool. */
  viewLogs(batchSize: number = this.defaultBatchSize): void {
    const allLogs = this.logs.toArray();

    if (this.currentBatchStart >= allLogs.length) {
      console.log('[Konsole] No more logs.');
      this.currentBatchStart = 0;
      return;
    }

    const batchEnd = Math.min(this.currentBatchStart + batchSize, allLogs.length);
    const batch    = allLogs.slice(this.currentBatchStart, batchEnd);

    const formatted = batch.map((e) => ({
      time:      e.timestamp.toISOString(),
      level:     e.level,
      namespace: e.namespace,
      msg:       e.msg,
      fields:    Object.keys(e.fields).length ? JSON.stringify(e.fields) : '',
    }));

    console.table(formatted);
    this.currentBatchStart = batchEnd;

    if (this.currentBatchStart >= allLogs.length) {
      console.log('[Konsole] End of logs. Call viewLogs() again to restart.');
    }
  }

  /** Returns all stored log entries as a readonly array. */
  getLogs(): ReadonlyArray<LogEntry> {
    return this.logs.toArray();
  }

  /** Returns stored log entries asynchronously (resolves from the worker when `useWorker: true`). */
  getLogsAsync(): Promise<ReadonlyArray<LogEntry>> {
    if (this.useWorker && Konsole.sharedWorker) {
      return new Promise((resolve) => {
        const requestId = `${this.namespace}-${Date.now()}-${Math.random()}`;
        Konsole.workerPendingCallbacks.set(requestId, resolve);
        Konsole.sharedWorker?.postMessage({
          type: 'GET_LOGS',
          namespace: this.namespace,
          requestId,
        });
      });
    }
    return Promise.resolve(this.getLogs());
  }

  /** Discard all stored log entries. */
  clearLogs(): void {
    this.logs.clear();
    this.currentBatchStart = 0;

    if (this.useWorker && Konsole.sharedWorker) {
      Konsole.sharedWorker.postMessage({ type: 'CLEAR_LOGS', namespace: this.namespace });
    }
  }

  /** Reset the `viewLogs()` pagination cursor back to the beginning. */
  resetBatch(): void {
    this.currentBatchStart = 0;
  }

  /** Returns memory usage statistics for this logger's buffer. */
  getStats(): { logCount: number; maxLogs: number; memoryUsage: string } {
    const logCount = this.logs.size;
    return {
      logCount,
      maxLogs: this.maxLogs,
      memoryUsage: `${logCount}/${this.maxLogs} (${((logCount / this.maxLogs) * 100).toFixed(1)}%)`,
    };
  }

  /** Flush transports and remove this logger from the registry. */
  async destroy(): Promise<void> {
    if (this.cleanupIntervalId) clearInterval(this.cleanupIntervalId);
    await Promise.all(this.transports.map((t) => t.destroy()));
    Konsole.instances.delete(this.namespace);
  }

  // ─── Private internals ─────────────────────────────────────────────────────

  /**
   * Parses log call arguments into a structured { msg, fields } pair.
   *
   * Supported calling conventions:
   *   logger.info('message')                       → msg='message',   fields={}
   *   logger.info('message', { userId: 1 })        → msg='message',   fields={userId:1}
   *   logger.info({ msg: 'message', userId: 1 })   → msg='message',   fields={userId:1}  (Pino-style)
   *   logger.error(new Error('oops'))              → msg='oops',      fields={err: Error}
   *   logger.info('a', 'b', 'c')                   → msg='a b c',     fields={}
   */
  private parseArgs(args: unknown[]): { msg: string; fields: Record<string, unknown> } {
    if (args.length === 0) return { msg: '', fields: {} };

    const first = args[0];

    // Error as the sole first argument
    if (first instanceof Error) {
      return { msg: first.message, fields: { err: first } };
    }

    // Pino-style: first arg is a plain object containing a `msg` key
    if (
      typeof first === 'object' &&
      first !== null &&
      !Array.isArray(first) &&
      !(first instanceof Error) &&
      'msg' in first
    ) {
      const { msg, ...rest } = first as Record<string, unknown>;
      return { msg: String(msg), fields: rest };
    }

    // Standard: string message with an optional trailing fields object
    if (typeof first === 'string') {
      if (
        args.length === 2 &&
        typeof args[1] === 'object' &&
        args[1] !== null &&
        !Array.isArray(args[1]) &&
        !(args[1] instanceof Error)
      ) {
        return { msg: first, fields: args[1] as Record<string, unknown> };
      }

      // Multiple args — join as a single message string
      return {
        msg: args.map((a) =>
          typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a),
        ).join(' '),
        fields: {},
      };
    }

    // Fallback: serialize everything into msg
    return {
      msg: args.map((a) =>
        typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a),
      ).join(' '),
      fields: {},
    };
  }

  private addLog(level: LogLevelName, args: unknown[]): void {
    // Level threshold — discard early, nothing written to buffer
    if (LEVELS[level] < this.minLevelValue) return;

    const { msg, fields } = this.parseArgs(args);

    const entry: LogEntry = {
      msg,
      messages: args,
      // bindings are the base; call-site fields override on collision
      fields: { ...this.bindings, ...fields },
      timestamp: new Date(),
      namespace: this.namespace,
      level,
      levelValue: LEVELS[level],
      logtype: level, // @deprecated alias
    };

    // Store in the main-thread circular buffer (always synchronous)
    this.logs.push(entry);

    // Forward to Web Worker when enabled
    if (this.useWorker && Konsole.sharedWorker) {
      const serializable: SerializableLogEntry = {
        msg,
        messages: args.map((m) => (typeof m === 'object' ? JSON.stringify(m) : m)),
        fields,
        timestamp: entry.timestamp.toISOString(),
        namespace: this.namespace,
        level,
        levelValue: LEVELS[level],
        logtype: level,
      };
      Konsole.sharedWorker.postMessage({
        type: 'ADD_LOG',
        namespace: this.namespace,
        payload: serializable,
      });
    }

    // Forward to transports (when not using worker)
    if (!this.useWorker) {
      for (const transport of this.transports) {
        transport.write(entry);
      }
    }

    this.outputLog(entry);
  }

  private outputLog(entry: LogEntry): void {
    // The global flag (set via enableGlobalPrint / exposeToWindow) bypasses all filters
    const globalOverride =
      (globalThis as Record<string, unknown>)[Konsole.globalFlagName] === true;

    if (!globalOverride) {
      // Deprecated boolean criteria: false = silent
      if (typeof this.criteria === 'boolean' && !this.criteria) return;
      // Function criteria: acts as an additional filter on top of level
      if (typeof this.criteria === 'function' && !this.criteria(entry)) return;
    }

    this.formatter.write(entry);
  }

  private initGlobalFlag(): void {
    if (!(Konsole.globalFlagName in globalThis)) {
      (globalThis as Record<string, unknown>)[Konsole.globalFlagName] = false;
    }
  }

  private flushOldLogs(): void {
    const cutoff = new Date(Date.now() - this.retentionPeriod);
    this.logs.retain((log) => log.timestamp > cutoff);
  }

  // ─── Worker setup ──────────────────────────────────────────────────────────

  private initWorker(transports: TransportConfig[]): void {
    if (!Konsole.sharedWorker) {
      try {
        const blob      = new Blob([this.getWorkerCode()], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        Konsole.sharedWorker = new Worker(workerUrl);

        Konsole.sharedWorker.onmessage = (event: MessageEvent<WorkerMessage>) => {
          const { type, payload, requestId } = event.data;
          if (type === 'LOGS_RESPONSE' && requestId) {
            const callback = Konsole.workerPendingCallbacks.get(requestId);
            if (callback) {
              const logs = (payload as SerializableLogEntry[]).map((e) => ({
                ...e,
                timestamp: new Date(e.timestamp),
              }));
              callback(logs);
              Konsole.workerPendingCallbacks.delete(requestId);
            }
          }
        };
      } catch {
        console.warn('[Konsole] Failed to initialize worker, falling back to main thread.');
        this.useWorker = false;
        return;
      }
    }

    Konsole.sharedWorker?.postMessage({
      type: 'CONFIGURE',
      namespace: this.namespace,
      payload: {
        maxLogs: this.maxLogs,
        retentionPeriod: this.retentionPeriod,
        transports: transports.map((t) => ({
          name:          t.name,
          url:           t.url,
          method:        t.method,
          headers:       t.headers,
          batchSize:     t.batchSize,
          flushInterval: t.flushInterval,
          retryAttempts: t.retryAttempts,
        })),
      },
    });
  }

  private getWorkerCode(): string {
    return `
      const logBuffers    = new Map();
      const bufferConfigs = new Map();
      const transports    = new Map();

      class CircularBuffer {
        constructor(capacity) {
          this.capacity = capacity;
          this.buffer   = new Array(capacity);
          this.head     = 0;
          this.tail     = 0;
          this._size    = 0;
        }
        push(item) {
          this.buffer[this.tail] = item;
          this.tail = (this.tail + 1) % this.capacity;
          if (this._size < this.capacity) { this._size++; }
          else { this.head = (this.head + 1) % this.capacity; }
        }
        toArray() {
          const out = [];
          for (let i = 0; i < this._size; i++) {
            const item = this.buffer[(this.head + i) % this.capacity];
            if (item !== undefined) out.push(item);
          }
          return out;
        }
        retain(fn) {
          const kept = this.toArray().filter(fn);
          this.clear();
          kept.forEach(item => this.push(item));
          return this._size;
        }
        clear() {
          this.buffer = new Array(this.capacity);
          this.head = this.tail = this._size = 0;
        }
        get size() { return this._size; }
      }

      function getBuffer(ns) {
        let buf = logBuffers.get(ns);
        if (!buf) {
          const cfg = bufferConfigs.get(ns) || { maxLogs: 10000 };
          buf = new CircularBuffer(cfg.maxLogs);
          logBuffers.set(ns, buf);
        }
        return buf;
      }

      async function flush(t) {
        if (!t.batch.length) return;
        const batch  = t.batch.splice(0);
        try {
          await fetch(t.cfg.url, {
            method:  t.cfg.method || 'POST',
            headers: { 'Content-Type': 'application/json', ...(t.cfg.headers || {}) },
            body:    JSON.stringify({ transport: t.cfg.name, logs: batch, sentAt: new Date().toISOString() }),
          });
        } catch (e) { console.warn('[Konsole Worker]', e); }
      }

      self.onmessage = ({ data: { type, payload, namespace: ns, requestId } }) => {
        switch (type) {
          case 'ADD_LOG':
            if (ns && payload) {
              getBuffer(ns).push(payload);
              transports.forEach(t => {
                t.batch.push(payload);
                if (t.batch.length >= (t.cfg.batchSize || 50)) flush(t);
              });
            }
            break;
          case 'GET_LOGS':
            if (ns) self.postMessage({ type: 'LOGS_RESPONSE', payload: (logBuffers.get(ns) || { toArray: () => [] }).toArray(), ns, requestId });
            break;
          case 'CLEAR_LOGS':
            if (ns) { const b = logBuffers.get(ns); if (b) b.clear(); }
            break;
          case 'FLUSH_OLD':
            if (ns) {
              const b = logBuffers.get(ns), cfg = bufferConfigs.get(ns);
              if (b && cfg) { const cut = new Date(Date.now() - cfg.retentionPeriod).toISOString(); b.retain(e => e.timestamp > cut); }
            }
            break;
          case 'CONFIGURE':
            if (ns && payload) {
              bufferConfigs.set(ns, payload);
              (payload.transports || []).forEach(tc => {
                const t = { cfg: tc, batch: [] };
                t.timer = setInterval(() => flush(t), tc.flushInterval || 10000);
                transports.set(tc.name, t);
              });
            }
            break;
        }
      };

      setInterval(() => {
        logBuffers.forEach((buf, ns) => {
          const cfg = bufferConfigs.get(ns);
          if (cfg) { const cut = new Date(Date.now() - cfg.retentionPeriod).toISOString(); buf.retain(e => e.timestamp > cut); }
        });
      }, 3600000);
    `;
  }
}

export default Konsole;
