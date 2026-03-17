import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpTransport } from '../../transports/HttpTransport';
import type { LogEntry } from '../../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    msg: 'test message',
    messages: ['test message'],
    fields: { key: 'val' },
    timestamp: new Date('2024-06-01T12:00:00.000Z'),
    namespace: 'Test',
    level: 'info',
    levelValue: 30,
    ...overrides,
  };
}

function makeFetch(ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
  } as Response);
}

describe('HttpTransport', () => {
  let fetchMock: ReturnType<typeof makeFetch>;

  beforeEach(() => {
    fetchMock = makeFetch();
  });

  it('requires fetch to be available', () => {
    // Temporarily remove globalThis.fetch to simulate an environment without it
    const originalFetch = globalThis.fetch;
    // @ts-expect-error — deliberately deleting for testing
    delete globalThis.fetch;
    try {
      expect(() =>
        new HttpTransport({ name: 't', url: 'http://x' }),
      ).toThrow(/fetch is not available/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('uses fetchImpl if provided', () => {
    const t = new HttpTransport({ name: 't', url: 'http://x', fetchImpl: fetchMock });
    expect(t.name).toBe('t');
  });

  it('batches entries and flushes when batchSize is reached', async () => {
    const t = new HttpTransport({
      name: 'batch-test',
      url: 'http://localhost/logs',
      batchSize: 2,
      flushInterval: 999999,
      fetchImpl: fetchMock,
    });

    t.write(makeEntry({ msg: 'first' }));
    expect(fetchMock).not.toHaveBeenCalled();

    t.write(makeEntry({ msg: 'second' })); // triggers auto-flush
    // Wait one microtask for the async flush
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledOnce();

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.logs).toHaveLength(2);
    expect(body.transport).toBe('batch-test');

    await t.destroy();
  });

  it('sends Pino-compatible payload schema', async () => {
    const t = new HttpTransport({
      name: 'schema-test',
      url: 'http://localhost/logs',
      batchSize: 1,
      fetchImpl: fetchMock,
    });

    t.write(makeEntry({ msg: 'hello', fields: { userId: 42 } }));
    await Promise.resolve();

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    const entry = body.logs[0];
    expect(entry.level).toBe(30);
    expect(entry.levelName).toBe('info');
    expect(entry.msg).toBe('hello');
    expect(entry.userId).toBe(42);
    expect(typeof entry.time).toBe('string');

    await t.destroy();
  });

  it('applies a filter predicate', async () => {
    const t = new HttpTransport({
      name: 'filter-test',
      url: 'http://localhost/logs',
      batchSize: 10,
      flushInterval: 999999,
      filter: (e) => e.level === 'error',
      fetchImpl: fetchMock,
    });

    t.write(makeEntry({ level: 'info' }));
    t.write(makeEntry({ level: 'error', msg: 'critical' }));

    await t.flush();
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].msg).toBe('critical');

    await t.destroy();
  });

  it('uses a transform function when provided', async () => {
    const t = new HttpTransport({
      name: 'transform-test',
      url: 'http://localhost/logs',
      batchSize: 1,
      fetchImpl: fetchMock,
      transform: (e) => ({ custom: true, msg: e.msg }),
    });

    t.write(makeEntry({ msg: 'transformed' }));
    await Promise.resolve();

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.logs[0]).toEqual({ custom: true, msg: 'transformed' });

    await t.destroy();
  });

  it('flush does nothing when batch is empty', async () => {
    const t = new HttpTransport({
      name: 'empty-flush',
      url: 'http://localhost/logs',
      fetchImpl: fetchMock,
    });
    await t.flush();
    expect(fetchMock).not.toHaveBeenCalled();
    await t.destroy();
  });

  it('logs a warning on HTTP error and schedules retry', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failFetch = makeFetch(false, 500);

    const t = new HttpTransport({
      name: 'retry-test',
      url: 'http://localhost/logs',
      batchSize: 1,
      retryAttempts: 1,
      fetchImpl: failFetch,
    });

    t.write(makeEntry());
    await Promise.resolve();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
    await t.destroy();
  });

  it('sends custom headers', async () => {
    const t = new HttpTransport({
      name: 'header-test',
      url: 'http://localhost/logs',
      batchSize: 1,
      headers: { 'X-Api-Key': 'secret' },
      fetchImpl: fetchMock,
    });

    t.write(makeEntry());
    await Promise.resolve();

    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['X-Api-Key']).toBe('secret');
    expect(headers['Content-Type']).toBe('application/json');

    await t.destroy();
  });
});
