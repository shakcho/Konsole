import { describe, it, expect, vi } from 'vitest';
import {
  PrettyFormatter,
  JsonFormatter,
  TextFormatter,
  SilentFormatter,
  createFormatter,
} from '../formatter';
import type { LogEntry } from '../types';

/** Strip ANSI escape sequences so assertions work regardless of USE_COLORS. */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    msg: 'test message',
    messages: ['test message'],
    fields: {},
    timestamp: new Date('2024-06-15T10:23:45.123Z'),
    namespace: 'Test',
    level: 'info',
    levelValue: 30,
    ...overrides,
  };
}

describe('formatters', () => {
  describe('PrettyFormatter', () => {
    it('writes to process.stdout for info/debug/warn/trace levels', () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const f = new PrettyFormatter();

      f.write(makeEntry({ level: 'info' }));
      expect(writeSpy).toHaveBeenCalledOnce();
      const line = stripAnsi(String(writeSpy.mock.calls[0][0]));
      expect(line).toContain('INF');
      expect(line).toContain('[Test]');
      expect(line).toContain('test message');
      writeSpy.mockRestore();
    });

    it('writes to process.stderr for error and fatal levels', () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const f = new PrettyFormatter();

      f.write(makeEntry({ level: 'error' }));
      expect(stderrSpy).toHaveBeenCalledOnce();
      stderrSpy.mockRestore();
    });

    it('includes extra fields in output', () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const f = new PrettyFormatter();

      f.write(makeEntry({ fields: { userId: 42, action: 'login' } }));
      const line = stripAnsi(String(writeSpy.mock.calls[0][0]));
      expect(line).toContain('userId=42');
      expect(line).toContain('action=login');
      writeSpy.mockRestore();
    });

    it('includes the namespace in brackets', () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const f = new PrettyFormatter();
      f.write(makeEntry({ namespace: 'MyApp' }));
      const line = stripAnsi(String(writeSpy.mock.calls[0][0]));
      expect(line).toContain('[MyApp]');
      writeSpy.mockRestore();
    });
  });

  describe('JsonFormatter', () => {
    it('writes valid JSON to stdout for non-error levels', () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const f = new JsonFormatter();

      f.write(makeEntry({ level: 'info', msg: 'hello', fields: { port: 3000 } }));

      const raw = String(writeSpy.mock.calls[0][0]).trim();
      const parsed = JSON.parse(raw);

      expect(parsed.level).toBe(30);
      expect(parsed.levelName).toBe('info');
      expect(parsed.namespace).toBe('Test');
      expect(parsed.msg).toBe('hello');
      expect(parsed.port).toBe(3000);
      expect(typeof parsed.time).toBe('string');
      writeSpy.mockRestore();
    });

    it('writes error-level entries to stderr', () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const f = new JsonFormatter();

      f.write(makeEntry({ level: 'error' }));
      expect(stderrSpy).toHaveBeenCalledOnce();
      stderrSpy.mockRestore();
    });

    it('spreads fields into the JSON root', () => {
      const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const f = new JsonFormatter();
      f.write(makeEntry({ fields: { requestId: 'abc', ms: 42 } }));

      const parsed = JSON.parse(String(writeSpy.mock.calls[0][0]).trim());
      expect(parsed.requestId).toBe('abc');
      expect(parsed.ms).toBe(42);
      writeSpy.mockRestore();
    });
  });

  describe('TextFormatter', () => {
    it('writes a plain-text line to console.log', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const f = new TextFormatter();

      f.write(makeEntry({ level: 'warn', msg: 'caution', fields: { code: 42 } }));

      expect(logSpy).toHaveBeenCalledOnce();
      const line = String(logSpy.mock.calls[0][0]);
      expect(line).toContain('WRN');
      expect(line).toContain('[Test]');
      expect(line).toContain('caution');
      expect(line).toContain('code=42');
      // No ANSI sequences
      expect(line).not.toMatch(/\x1b\[/);
      logSpy.mockRestore();
    });
  });

  describe('SilentFormatter', () => {
    it('does not write anything', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const logSpy    = vi.spyOn(console, 'log').mockImplementation(() => {});

      const f = new SilentFormatter();
      f.write(makeEntry({ level: 'fatal' }));

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();

      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
      logSpy.mockRestore();
    });
  });

  describe('createFormatter', () => {
    it("creates a SilentFormatter for 'silent'", () => {
      expect(createFormatter('silent')).toBeInstanceOf(SilentFormatter);
    });

    it("creates a PrettyFormatter for 'pretty'", () => {
      expect(createFormatter('pretty')).toBeInstanceOf(PrettyFormatter);
    });

    it("creates a JsonFormatter for 'json'", () => {
      expect(createFormatter('json')).toBeInstanceOf(JsonFormatter);
    });

    it("creates a TextFormatter for 'text'", () => {
      expect(createFormatter('text')).toBeInstanceOf(TextFormatter);
    });
  });
});
