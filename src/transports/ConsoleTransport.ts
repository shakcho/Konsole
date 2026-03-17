import { createFormatter, type KonsoleFormat } from '../formatter';
import type { LogEntry, Transport } from '../types';

export interface ConsoleTransportOptions {
  /** Default: 'console' */
  name?: string;
  /**
   * Output format. Defaults to `'auto'` (pretty on TTY, JSON on non-TTY, browser in browser).
   * Useful when the main logger uses `format: 'silent'` and you want transports
   * to handle all rendering.
   */
  format?: KonsoleFormat;
  /** Only write entries that pass this predicate. */
  filter?: (entry: LogEntry) => boolean;
}

/**
 * Writes log entries to the console / stdout using the formatter pipeline.
 *
 * Primarily useful when the main logger is configured with `format: 'silent'`
 * and you want granular control over what gets printed via separate transports.
 *
 * @example
 * ```ts
 * const logger = new Konsole({
 *   namespace: 'App',
 *   format: 'silent',
 *   transports: [
 *     new ConsoleTransport({ format: 'pretty' }),
 *     new FileTransport({ path: '/var/log/app.log' }),
 *   ],
 * });
 * ```
 */
export class ConsoleTransport implements Transport {
  readonly name: string;
  private formatter: ReturnType<typeof createFormatter>;
  private filter?: (entry: LogEntry) => boolean;

  constructor(options: ConsoleTransportOptions = {}) {
    this.name      = options.name   ?? 'console';
    this.formatter = createFormatter(options.format ?? 'auto');
    this.filter    = options.filter;
  }

  write(entry: LogEntry): void {
    if (this.filter && !this.filter(entry)) return;
    this.formatter.write(entry);
  }

  async destroy(): Promise<void> {
    // nothing to release
  }
}
