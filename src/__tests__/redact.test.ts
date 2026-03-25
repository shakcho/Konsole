import { describe, it, expect } from 'vitest';
import { compileRedactPaths, applyRedaction, REDACTED } from '../redact';
import type { LogEntry } from '../types';

function makeEntry(fields: Record<string, unknown>): LogEntry {
  return {
    msg: 'test',
    messages: [],
    fields,
    timestamp: new Date(),
    namespace: 'Test',
    level: 'info',
    levelValue: 30,
  };
}

describe('compileRedactPaths', () => {
  it('splits dot-paths into segment arrays', () => {
    expect(compileRedactPaths(['a.b.c'])).toEqual([['a', 'b', 'c']]);
  });

  it('handles single-segment paths (no dot)', () => {
    expect(compileRedactPaths(['password'])).toEqual([['password']]);
  });

  it('returns empty array for empty input', () => {
    expect(compileRedactPaths([])).toEqual([]);
  });

  it('handles multiple paths', () => {
    expect(compileRedactPaths(['a', 'b.c'])).toEqual([['a'], ['b', 'c']]);
  });
});

describe('applyRedaction', () => {
  it('returns the original entry unchanged when paths is empty', () => {
    const entry = makeEntry({ password: 'secret' });
    expect(applyRedaction(entry, [])).toBe(entry);
  });

  it('redacts a top-level field', () => {
    const entry = makeEntry({ user: 'alice', password: 'hunter2' });
    const result = applyRedaction(entry, [['password']]);
    expect(result.fields.password).toBe(REDACTED);
    expect(result.fields.user).toBe('alice');
  });

  it('redacts a two-level nested field', () => {
    const entry = makeEntry({ user: { name: 'alice', token: 'abc' } });
    const result = applyRedaction(entry, [['user', 'token']]);
    expect((result.fields.user as Record<string, unknown>).token).toBe(REDACTED);
    expect((result.fields.user as Record<string, unknown>).name).toBe('alice');
  });

  it('redacts a three-level nested field', () => {
    const entry = makeEntry({ req: { headers: { authorization: 'Bearer xyz', 'content-type': 'application/json' } } });
    const result = applyRedaction(entry, [['req', 'headers', 'authorization']]);
    const headers = (result.fields.req as Record<string, unknown>).headers as Record<string, unknown>;
    expect(headers.authorization).toBe(REDACTED);
    expect(headers['content-type']).toBe('application/json');
  });

  it('replaces an entire object value when the terminal path points to an object', () => {
    const entry = makeEntry({ user: { id: 1, ssn: '123-45-6789' } });
    const result = applyRedaction(entry, [['user']]);
    expect(result.fields.user).toBe(REDACTED);
  });

  it('silently ignores a path that does not exist', () => {
    const entry = makeEntry({ a: 1 });
    const result = applyRedaction(entry, [['nonexistent']]);
    expect(result.fields).toEqual({ a: 1 });
  });

  it('silently ignores a deep path when an intermediate key is missing', () => {
    const entry = makeEntry({ req: { method: 'GET' } });
    const result = applyRedaction(entry, [['req', 'headers', 'authorization']]);
    expect((result.fields.req as Record<string, unknown>).method).toBe('GET');
  });

  it('does not mutate the original entry fields object', () => {
    const fields = { password: 'secret' };
    const entry = makeEntry(fields);
    applyRedaction(entry, [['password']]);
    expect(fields.password).toBe('secret');
  });

  it('does not mutate original nested objects', () => {
    const nested = { token: 'abc', id: 1 };
    const entry = makeEntry({ user: nested });
    applyRedaction(entry, [['user', 'token']]);
    expect(nested.token).toBe('abc');
  });

  it('does not traverse arrays — walk terminates without error', () => {
    const entry = makeEntry({ items: [{ token: 'abc' }] });
    const result = applyRedaction(entry, [['items', 'token']]);
    // items is an array, path terminates; value is left untouched
    expect((result.fields.items as Array<{ token: string }>)[0].token).toBe('abc');
  });

  it('does not traverse Error instances — walk terminates without error', () => {
    const err = new Error('oops');
    const entry = makeEntry({ err });
    const result = applyRedaction(entry, [['err', 'message']]);
    // Error is not traversed; message is untouched
    expect((result.fields.err as Error).message).toBe('oops');
  });

  it('handles null intermediate segment without throwing', () => {
    const entry = makeEntry({ req: null });
    const result = applyRedaction(entry, [['req', 'headers']]);
    expect(result.fields.req).toBeNull();
  });

  it('is idempotent — redacting an already-redacted value stays [REDACTED]', () => {
    const entry = makeEntry({ password: REDACTED });
    const result = applyRedaction(entry, [['password']]);
    expect(result.fields.password).toBe(REDACTED);
  });

  it('redacts multiple paths in a single call', () => {
    const entry = makeEntry({ password: 'secret', token: 'abc', user: 'alice' });
    const result = applyRedaction(entry, [['password'], ['token']]);
    expect(result.fields.password).toBe(REDACTED);
    expect(result.fields.token).toBe(REDACTED);
    expect(result.fields.user).toBe('alice');
  });

  it('handles duplicate paths without error (idempotent)', () => {
    const entry = makeEntry({ password: 'secret' });
    const result = applyRedaction(entry, [['password'], ['password']]);
    expect(result.fields.password).toBe(REDACTED);
  });

  it('returns a new LogEntry object (not the same reference)', () => {
    const entry = makeEntry({ password: 'secret' });
    const result = applyRedaction(entry, [['password']]);
    expect(result).not.toBe(entry);
  });
});
