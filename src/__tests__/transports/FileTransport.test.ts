import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { FileTransport } from '../../transports/FileTransport';
import type { LogEntry } from '../../types';

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    msg: 'file test',
    messages: ['file test'],
    fields: {},
    timestamp: new Date('2024-06-01T12:00:00.000Z'),
    namespace: 'Test',
    level: 'info',
    levelValue: 30,
    ...overrides,
  };
}

function tmpPath(): string {
  return path.join(os.tmpdir(), `konsole-test-${Date.now()}-${Math.random().toString(36).slice(2)}.log`);
}

describe('FileTransport', () => {
  const files: string[] = [];

  afterEach(() => {
    for (const f of files) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
    files.length = 0;
  });

  it('writes JSON lines to a file', async () => {
    const filePath = tmpPath();
    files.push(filePath);

    const t = new FileTransport({ path: filePath });
    await t.ready();

    t.write(makeEntry({ msg: 'first', fields: { n: 1 } }));
    t.write(makeEntry({ msg: 'second' }));
    await t.destroy();

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);

    const first = JSON.parse(lines[0]);
    expect(first.msg).toBe('first');
    expect(first.n).toBe(1);
    expect(first.levelName).toBe('info');

    const second = JSON.parse(lines[1]);
    expect(second.msg).toBe('second');
  });

  it('buffers entries written before the stream is ready', async () => {
    const filePath = tmpPath();
    files.push(filePath);

    const t = new FileTransport({ path: filePath });
    // Write immediately — stream is not yet open
    t.write(makeEntry({ msg: 'buffered' }));
    await t.ready(); // now wait for open
    await t.destroy();

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('"buffered"');
  });

  it('writes text format lines when format: text', async () => {
    const filePath = tmpPath();
    files.push(filePath);

    const t = new FileTransport({ path: filePath, format: 'text' });
    await t.ready();
    t.write(makeEntry({ msg: 'plain', level: 'warn' }));
    await t.destroy();

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('WRN');
    expect(content).toContain('plain');
    expect(content).not.toMatch(/^\{/m); // not JSON
  });

  it('appends to file by default (flags: a)', async () => {
    const filePath = tmpPath();
    files.push(filePath);

    const t1 = new FileTransport({ path: filePath });
    await t1.ready();
    t1.write(makeEntry({ msg: 'first run' }));
    await t1.destroy();

    const t2 = new FileTransport({ path: filePath });
    await t2.ready();
    t2.write(makeEntry({ msg: 'second run' }));
    await t2.destroy();

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
  });

  it('truncates file when flags: w', async () => {
    const filePath = tmpPath();
    files.push(filePath);

    const t1 = new FileTransport({ path: filePath });
    await t1.ready();
    t1.write(makeEntry({ msg: 'old' }));
    await t1.destroy();

    const t2 = new FileTransport({ path: filePath, flags: 'w' });
    await t2.ready();
    t2.write(makeEntry({ msg: 'new' }));
    await t2.destroy();

    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).not.toContain('"old"');
    expect(content).toContain('"new"');
  });

  it('applies a filter — skips entries that fail predicate', async () => {
    const filePath = tmpPath();
    files.push(filePath);

    const t = new FileTransport({
      path: filePath,
      filter: (e) => e.level === 'error',
    });
    await t.ready();

    t.write(makeEntry({ level: 'info', msg: 'ignored' }));
    t.write(makeEntry({ level: 'error', msg: 'written' }));
    await t.destroy();

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).msg).toBe('written');
  });

  it('uses a custom name when provided', () => {
    const filePath = tmpPath();
    files.push(filePath);
    const t = new FileTransport({ path: filePath, name: 'my-log' });
    expect(t.name).toBe('my-log');
    void t.destroy();
  });

  it('defaults name to file:<path>', () => {
    const filePath = tmpPath();
    files.push(filePath);
    const t = new FileTransport({ path: filePath });
    expect(t.name).toBe(`file:${filePath}`);
    void t.destroy();
  });
});
