import { describe, it, expect, vi } from 'vitest';
import { ConsoleTransport } from '../../transports/ConsoleTransport';
import type { LogEntry } from '../../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    msg: 'test',
    messages: ['test'],
    fields: {},
    timestamp: new Date(),
    namespace: 'Test',
    level: 'info',
    levelValue: 30,
    ...overrides,
  };
}

describe('ConsoleTransport', () => {
  it('has a default name of console', () => {
    const t = new ConsoleTransport();
    expect(t.name).toBe('console');
  });

  it('accepts a custom name', () => {
    const t = new ConsoleTransport({ name: 'my-console' });
    expect(t.name).toBe('my-console');
  });

  it('calls write on the underlying formatter', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const t = new ConsoleTransport({ format: 'json' });
    t.write(makeEntry({ msg: 'structured' }));
    expect(stdoutSpy).toHaveBeenCalledOnce();
    stdoutSpy.mockRestore();
  });

  it('applies a filter — does not write when predicate fails', () => {
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const t = new ConsoleTransport({
      format: 'json',
      filter: (e) => e.level === 'error',
    });

    t.write(makeEntry({ level: 'info' }));
    expect(stdoutSpy).not.toHaveBeenCalled();

    // error-level entries route to stderr in JsonFormatter
    t.write(makeEntry({ level: 'error', msg: 'critical' }));
    expect(stderrSpy).toHaveBeenCalledOnce();
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('does nothing on destroy', async () => {
    const t = new ConsoleTransport();
    await expect(t.destroy()).resolves.toBeUndefined();
  });
});
