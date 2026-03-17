import { isNode } from '../env';
import { toLine, type FileFormat } from './base';
import type { LogEntry, Transport } from '../types';

/**
 * Minimal writable-stream contract — duck-typed so it works with Node.js
 * `stream.Writable`, `fs.WriteStream`, and any compatible implementation
 * without requiring `@types/node` in the consumer's project.
 */
export interface WritableLike {
  write(chunk: string): boolean;
  end(cb?: (err?: Error | null) => void): void;
  on(event: 'error', listener: (err: Error) => void): this;
}

export interface StreamTransportOptions {
  /** The writable stream to pipe entries into. */
  stream: WritableLike;
  /** Default: 'stream' */
  name?: string;
  /**
   * Line format written to the stream.
   * - `'json'`  — newline-delimited JSON (default, best for log aggregators)
   * - `'text'`  — human-readable plain text
   */
  format?: FileFormat;
  /** Only write entries that pass this predicate. */
  filter?: (entry: LogEntry) => boolean;
}

/**
 * Writes log entries as serialized lines into any `WritableLike` stream.
 *
 * Useful for piping logs into HTTP streams, in-memory streams for testing,
 * or any custom writable destination.
 *
 * @example
 * ```ts
 * import { createWriteStream } from 'node:fs';
 *
 * const logger = new Konsole({
 *   namespace: 'App',
 *   transports: [
 *     new StreamTransport({
 *       stream: createWriteStream('/tmp/debug.log', { flags: 'a' }),
 *       format: 'json',
 *     }),
 *   ],
 * });
 * ```
 */
export class StreamTransport implements Transport {
  readonly name: string;
  protected stream: WritableLike;
  protected format: FileFormat;
  protected filter?: (entry: LogEntry) => boolean;

  constructor(options: StreamTransportOptions) {
    if (!isNode) {
      throw new Error('[Konsole StreamTransport] StreamTransport is only available in Node.js.');
    }
    this.name   = options.name   ?? 'stream';
    this.stream = options.stream;
    this.format = options.format ?? 'json';
    this.filter = options.filter;

    this.stream.on('error', (err) => {
      console.error(`[Konsole StreamTransport: ${this.name}] Stream error: ${err.message}`);
    });
  }

  write(entry: LogEntry): void {
    if (this.filter && !this.filter(entry)) return;
    try {
      this.stream.write(toLine(entry, this.format) + '\n');
    } catch (err) {
      console.error(`[Konsole StreamTransport: ${this.name}] Write error:`, err);
    }
  }

  async destroy(): Promise<void> {
    return new Promise((resolve) => {
      this.stream.end(() => resolve());
    });
  }
}
