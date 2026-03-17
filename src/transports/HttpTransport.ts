import { getGlobalFetch } from '../env';
import { LEVELS } from '../levels';
import type { LogEntry, Transport, TransportConfig } from '../types';

/**
 * Batches log entries and POSTs them to an HTTP endpoint.
 *
 * Features:
 * - Configurable batch size and flush interval
 * - Exponential-backoff retry on failure
 * - Optional per-entry filter and transform
 * - Works in browser and Node.js ≥ 18 (or pass `fetchImpl` for older Node)
 */
export class HttpTransport implements Transport {
  readonly name: string;

  private config: Required<Omit<TransportConfig, 'filter' | 'transform' | 'fetchImpl'>> &
    Pick<TransportConfig, 'filter' | 'transform'>;
  private fetchFn: typeof fetch;
  private batch: LogEntry[] = [];
  private flushTimer?: ReturnType<typeof setInterval>;
  private retryQueue: LogEntry[][] = [];
  private isProcessing = false;

  constructor(config: TransportConfig) {
    const fetchFn = config.fetchImpl ?? getGlobalFetch();
    if (typeof fetchFn !== 'function') {
      throw new Error(
        `[Konsole HttpTransport: ${config.name}] fetch is not available. ` +
        'Requires Node.js >= 18, or pass fetchImpl (e.g. from "node-fetch").',
      );
    }
    this.fetchFn = fetchFn;
    this.name    = config.name;

    this.config = {
      name:          config.name,
      url:           config.url,
      method:        config.method        ?? 'POST',
      headers:       config.headers       ?? {},
      batchSize:     config.batchSize     ?? 50,
      flushInterval: config.flushInterval ?? 10000,
      retryAttempts: config.retryAttempts ?? 3,
      filter:        config.filter,
      transform:     config.transform,
    };

    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  write(entry: LogEntry): void {
    if (this.config.filter && !this.config.filter(entry)) return;

    this.batch.push(entry);
    if (this.batch.length >= this.config.batchSize) {
      void this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;
    const toSend  = this.batch.splice(0);
    await this.sendBatch(toSend, this.config.retryAttempts);
  }

  async destroy(): Promise<void> {
    if (this.flushTimer) clearInterval(this.flushTimer);
    await this.flush();
  }

  private async sendBatch(entries: LogEntry[], retriesLeft: number): Promise<void> {
    if (this.isProcessing) {
      this.retryQueue.push(entries);
      return;
    }
    this.isProcessing = true;

    try {
      const payload = entries.map((e) => {
        if (this.config.transform) return this.config.transform(e);
        return {
          level:     LEVELS[e.level],
          levelName: e.level,
          time:      e.timestamp.toISOString(),
          namespace: e.namespace,
          msg:       e.msg,
          ...e.fields,
        };
      });

      const res = await this.fetchFn(this.config.url, {
        method:  this.config.method,
        headers: { 'Content-Type': 'application/json', ...this.config.headers },
        body:    JSON.stringify({ transport: this.config.name, logs: payload, sentAt: new Date().toISOString() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[Konsole HttpTransport: ${this.config.name}]`, err);

      if (retriesLeft > 0) {
        const delay = 2 ** (this.config.retryAttempts - retriesLeft) * 1000;
        setTimeout(() => void this.sendBatch(entries, retriesLeft - 1), delay);
      }
    } finally {
      this.isProcessing = false;
      if (this.retryQueue.length > 0) {
        const next = this.retryQueue.shift()!;
        void this.sendBatch(next, this.config.retryAttempts);
      }
    }
  }
}
