import { isNode } from '../env';
import { toLine, type FileFormat } from './base';
import { StreamTransport, type StreamTransportOptions, type WritableLike } from './StreamTransport';
import type { LogEntry } from '../types';

export interface FileTransportOptions {
  /** Absolute or relative path of the log file. */
  path: string;
  /** Default: derived from path, e.g. `'file:/var/log/app.log'` */
  name?: string;
  /**
   * Line format.
   * - `'json'`  — newline-delimited JSON (default)
   * - `'text'`  — human-readable plain text
   */
  format?: FileFormat;
  /**
   * File open flag passed to `fs.createWriteStream`.
   * - `'a'`  — append (default, safe for long-running processes)
   * - `'w'`  — truncate on open
   */
  flags?: 'a' | 'w';
  /** Only write entries that pass this predicate. */
  filter?: (entry: LogEntry) => boolean;
}

/**
 * Appends log entries as serialized lines to a file on disk.
 *
 * Node.js only. Uses `fs.createWriteStream` internally — efficient for
 * high-throughput logging (writes are buffered by the OS).
 *
 * Entries written before the file handle is opened are buffered in memory
 * and flushed automatically once the stream is ready — no `await ready()`
 * needed for normal use.
 *
 * @example
 * ```ts
 * const logger = new Konsole({
 *   namespace: 'App',
 *   format: 'pretty',    // human-readable in terminal
 *   transports: [
 *     new FileTransport({ path: '/var/log/app.log' }),  // JSON to disk
 *   ],
 * });
 * ```
 */
export class FileTransport extends StreamTransport {
  private isReady = false;
  private pendingEntries: LogEntry[] = [];
  private filePath: string;
  private initialized: Promise<void>;

  constructor(options: FileTransportOptions) {
    if (!isNode) {
      throw new Error('[Konsole FileTransport] FileTransport is only available in Node.js.');
    }

    super({
      stream: createPlaceholder(),
      name:   options.name   ?? `file:${options.path}`,
      format: options.format ?? 'json',
      filter: options.filter,
    } satisfies StreamTransportOptions);

    this.filePath    = options.path;
    this.initialized = this.openFile(options.flags ?? 'a');
  }

  /** Override write to buffer entries until the file stream is open. */
  override write(entry: LogEntry): void {
    if (this.filter && !this.filter(entry)) return;
    if (!this.isReady) {
      this.pendingEntries.push(entry);
      return;
    }
    try {
      this.stream.write(toLine(entry, this.format) + '\n');
    } catch (err) {
      console.error(`[Konsole FileTransport: ${this.name}] Write error:`, err);
    }
  }

  /**
   * Resolves once the underlying file stream has been opened.
   * Not required for normal use — entries are buffered automatically.
   */
  ready(): Promise<void> {
    return this.initialized;
  }

  private async openFile(flags: string): Promise<void> {
    // Vite externalizes node:fs as a CJS module — named-export destructuring
    // may fail in the bundle. Access via .default as a fallback.
    const fsModule = await import('node:fs');
    const createWriteStream =
      fsModule.createWriteStream ??
      (fsModule as unknown as { default?: typeof import('node:fs') }).default?.createWriteStream;

    if (typeof createWriteStream !== 'function') {
      throw new Error('[Konsole FileTransport] Failed to load node:fs.createWriteStream');
    }

    const fileStream = createWriteStream(this.filePath, { flags }) as unknown as WritableLike;

    fileStream.on('error', (err) => {
      console.error(`[Konsole FileTransport: ${this.name}] File error: ${err.message}`);
    });

    this.stream  = fileStream;
    this.isReady = true;

    // Flush entries that arrived before the stream was ready
    for (const entry of this.pendingEntries) {
      this.stream.write(toLine(entry, this.format) + '\n');
    }
    this.pendingEntries = [];
  }
}

/** A no-op stream used as a placeholder during async file open. */
function createPlaceholder(): WritableLike {
  return {
    write: () => true,
    end:   (cb) => { cb?.(); },
    on:    function(this: WritableLike) { return this; },
  };
}
