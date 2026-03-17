import { describe, it, expect, vi } from 'vitest';
import { StreamTransport, type WritableLike } from '../../transports/StreamTransport';
import type { LogEntry } from '../../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    msg: 'hello',
    messages: ['hello'],
    fields: {},
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    namespace: 'Test',
    level: 'info',
    levelValue: 30,
    ...overrides,
  };
}

function makeStream(): { stream: WritableLike; lines: string[] } {
  const lines: string[] = [];
  const stream: WritableLike = {
    write(chunk: string) { lines.push(chunk); return true; },
    end(cb?: (err?: Error | null) => void) { cb?.(); },
    on(this: WritableLike) { return this; },
  };
  return { stream, lines };
}

describe('StreamTransport', () => {
  it('writes a JSON line for each entry', () => {
    const { stream, lines } = makeStream();
    const t = new StreamTransport({ stream, format: 'json' });

    t.write(makeEntry({ msg: 'first', fields: { n: 1 } }));
    t.write(makeEntry({ msg: 'second' }));

    expect(lines).toHaveLength(2);
    const parsed = JSON.parse(lines[0].trim());
    expect(parsed.msg).toBe('first');
    expect(parsed.n).toBe(1);
    expect(parsed.level).toBe(30);
    expect(parsed.levelName).toBe('info');
  });

  it('writes a text line when format is text', () => {
    const { stream, lines } = makeStream();
    const t = new StreamTransport({ stream, format: 'text' });

    t.write(makeEntry({ msg: 'plain text', level: 'warn' }));

    expect(lines[0]).toContain('WRN');
    expect(lines[0]).toContain('plain text');
    expect(lines[0]).toContain('[Test]');
    expect(lines[0]).not.toMatch(/\{/); // no JSON
  });

  it('appends a newline to each written chunk', () => {
    const { stream, lines } = makeStream();
    const t = new StreamTransport({ stream });
    t.write(makeEntry());
    expect(lines[0]).toMatch(/\n$/);
  });

  it('applies a filter — skips entries that fail the predicate', () => {
    const { stream, lines } = makeStream();
    const t = new StreamTransport({
      stream,
      filter: (e) => e.level === 'error',
    });

    t.write(makeEntry({ level: 'info' }));
    t.write(makeEntry({ level: 'error', msg: 'boom' }));

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0].trim());
    expect(parsed.msg).toBe('boom');
  });

  it('uses the name provided in options', () => {
    const { stream } = makeStream();
    const t = new StreamTransport({ stream, name: 'my-stream' });
    expect(t.name).toBe('my-stream');
  });

  it('defaults name to stream', () => {
    const { stream } = makeStream();
    const t = new StreamTransport({ stream });
    expect(t.name).toBe('stream');
  });

  it('calls stream.end on destroy', async () => {
    const { stream } = makeStream();
    const endSpy = vi.spyOn(stream, 'end');
    const t = new StreamTransport({ stream });
    await t.destroy();
    expect(endSpy).toHaveBeenCalledOnce();
  });

  it('logs a console error when stream.write throws', () => {
    const errorStream: WritableLike = {
      write() { throw new Error('write failed'); },
      end(cb) { cb?.(); },
      on(this: WritableLike) { return this; },
    };
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const t = new StreamTransport({ stream: errorStream });
    t.write(makeEntry());
    expect(errSpy).toHaveBeenCalledOnce();
    errSpy.mockRestore();
  });
});
