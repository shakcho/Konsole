/**
 * Represents a single log entry with metadata
 */
export type LogEntry = {
  messages: unknown[];
  timestamp: Date;
  namespace: string;
  logtype?: 'log' | 'error' | 'warn' | 'info';
};

/**
 * Criteria for conditional logging - can be a boolean or a function
 */
export type Criteria = boolean | ((logEntry: LogEntry) => boolean);

/**
 * Public interface for Konsole logger
 */
export interface KonsolePublic {
  viewLogs(batchSize?: number): void;
}

/**
 * Configuration options for Konsole
 */
export interface KonsoleOptions {
  /** Namespace for this logger instance */
  namespace?: string;
  /** Criteria for conditional logging */
  criteria?: Criteria;
  /** Default batch size for viewing logs */
  defaultBatchSize?: number;
  /** Log retention period in milliseconds (default: 48 hours) */
  retentionPeriod?: number;
  /** Cleanup interval in milliseconds (default: 1 hour) */
  cleanupInterval?: number;
}

/**
 * Konsole - A lightweight, namespaced logging library
 *
 * @example
 * ```ts
 * import { Konsole } from 'konsole-logger';
 *
 * const logger = new Konsole({ namespace: 'MyApp' });
 * logger.log('Hello, World!');
 * logger.error('Something went wrong');
 * ```
 */
export class Konsole implements KonsolePublic {
  private static instances: Map<string, Konsole> = new Map();
  private static windowFlagName = '__KonsolePrintEnabled__';

  private logs: LogEntry[] = [];
  private namespace: string;
  private criteria: Criteria;
  private defaultBatchSize: number;
  private currentBatchStart: number = 0;
  private retentionPeriod: number;
  private cleanupIntervalId?: ReturnType<typeof setInterval>;

  constructor(options: KonsoleOptions = {}) {
    const {
      namespace = 'Global',
      criteria = false,
      defaultBatchSize = 100,
      retentionPeriod = 48 * 60 * 60 * 1000, // 48 hours
      cleanupInterval = 60 * 60 * 1000, // 1 hour
    } = options;

    this.namespace = namespace;
    this.criteria = criteria;
    this.defaultBatchSize = defaultBatchSize;
    this.retentionPeriod = retentionPeriod;

    // Set up periodic cleanup
    this.cleanupIntervalId = setInterval(
      () => this.flushOldLogs(),
      cleanupInterval
    );

    // Register instance
    Konsole.instances.set(namespace, this);

    // Initialize window flag if in browser
    this.initWindowFlag();
  }

  /**
   * Exposes Konsole to the window object for debugging
   */
  static exposeToWindow(): void {
    if (typeof window === 'undefined') return;

    (window as unknown as Record<string, unknown>).__Konsole = {
      getLogger: (namespace: string = 'Global'): KonsolePublic => {
        const logger = Konsole.getLogger(namespace);
        return {
          viewLogs: (batchSize?: number) => logger.viewLogs(batchSize),
        };
      },
      listLoggers: () => Array.from(Konsole.instances.keys()),
      enableAll: () => Konsole.enableGlobalPrint(true),
      disableAll: () => Konsole.enableGlobalPrint(false),
    };
  }

  /**
   * Enable or disable global print flag
   */
  static enableGlobalPrint(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>)[Konsole.windowFlagName] = enabled;
  }

  /**
   * Get a logger instance by namespace
   */
  static getLogger(namespace: string = 'Global'): Konsole {
    const instance = Konsole.instances.get(namespace);
    if (!instance) {
      console.warn(`[Konsole] Logger with namespace "${namespace}" not found`);
      return new Konsole({ namespace });
    }
    return instance;
  }

  /**
   * Get all registered namespaces
   */
  static getNamespaces(): string[] {
    return Array.from(Konsole.instances.keys());
  }

  /**
   * Set the logging criteria
   */
  setCriteria(criteria: Criteria): void {
    this.criteria = criteria;
  }

  /**
   * Log a message
   */
  log(...args: unknown[]): void {
    this.addLog('log', args);
  }

  /**
   * Log an error message
   */
  error(...args: unknown[]): void {
    this.addLog('error', args);
  }

  /**
   * Log a warning message
   */
  warn(...args: unknown[]): void {
    this.addLog('warn', args);
  }

  /**
   * Log an info message
   */
  info(...args: unknown[]): void {
    this.addLog('info', args);
  }

  /**
   * View stored logs in batches
   */
  viewLogs(batchSize: number = this.defaultBatchSize): void {
    if (this.currentBatchStart >= this.logs.length) {
      console.log('[Konsole] No more logs.');
      this.currentBatchStart = 0;
      return;
    }

    const batchEnd = Math.min(
      this.currentBatchStart + batchSize,
      this.logs.length
    );
    const batch = this.logs.slice(this.currentBatchStart, batchEnd);

    // Format logs for display - flatten messages array for console.table
    const formattedBatch = batch.map((entry) => ({
      message: entry.messages
        .map((m) =>
          typeof m === 'object' ? JSON.stringify(m) : String(m)
        )
        .join(' '),
      timestamp: entry.timestamp,
      namespace: entry.namespace,
      logtype: entry.logtype,
    }));

    console.table(formattedBatch);

    this.currentBatchStart = batchEnd;

    if (this.currentBatchStart >= this.logs.length) {
      console.log('[Konsole] End of logs. Call viewLogs() again to restart.');
    }
  }

  /**
   * Get all logs for this namespace
   */
  getLogs(): ReadonlyArray<LogEntry> {
    return [...this.logs];
  }

  /**
   * Clear all logs for this namespace
   */
  clearLogs(): void {
    this.logs = [];
    this.currentBatchStart = 0;
  }

  /**
   * Reset the batch position for viewLogs
   */
  resetBatch(): void {
    this.currentBatchStart = 0;
  }

  /**
   * Destroy this logger instance and clean up
   */
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    Konsole.instances.delete(this.namespace);
  }

  private addLog(
    logtype: 'log' | 'error' | 'warn' | 'info',
    messages: unknown[]
  ): void {
    const logEntry: LogEntry = {
      messages,
      timestamp: new Date(),
      namespace: this.namespace,
      logtype,
    };
    this.logs.push(logEntry);
    this.processLog(logEntry);
  }

  private initWindowFlag(): void {
    if (typeof window === 'undefined') return;
    if (!(Konsole.windowFlagName in window)) {
      (window as unknown as Record<string, unknown>)[Konsole.windowFlagName] = false;
    }
  }

  private processLog(logEntry: LogEntry): void {
    const shouldPrint =
      (typeof window !== 'undefined' &&
        (window as unknown as Record<string, unknown>)[Konsole.windowFlagName]) ||
      this.logCriteria(logEntry);

    if (!shouldPrint) return;

    const prefix = `[${logEntry.namespace}]`;

    switch (logEntry.logtype) {
      case 'error':
        console.error(prefix, ...logEntry.messages);
        break;
      case 'warn':
        console.warn(prefix, ...logEntry.messages);
        break;
      case 'info':
        console.info(prefix, ...logEntry.messages);
        break;
      default:
        console.log(prefix, ...logEntry.messages);
    }
  }

  private logCriteria(logEntry: LogEntry): boolean {
    if (typeof this.criteria === 'boolean') {
      return this.criteria;
    }
    if (typeof this.criteria === 'function') {
      return this.criteria(logEntry);
    }
    return false;
  }

  private flushOldLogs(): void {
    const cutoffTime = new Date(Date.now() - this.retentionPeriod);
    this.logs = this.logs.filter((log) => log.timestamp > cutoffTime);
  }
}

export default Konsole;
