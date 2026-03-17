import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Konsole } from '../Konsole';
import type { LogEntry, Transport } from '../types';

// ─── SpyTransport ─────────────────────────────────────────────────────────────

class SpyTransport implements Transport {
  readonly name = 'spy';
  entries: LogEntry[] = [];
  write(entry: LogEntry): void { this.entries.push(entry); }
  async destroy(): Promise<void> { this.entries = []; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSilentLogger(overrides: ConstructorParameters<typeof Konsole>[0] = {}): Konsole {
  return new Konsole({ namespace: 'Test', format: 'silent', ...overrides });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Konsole', () => {
  afterEach(async () => {
    // Clean up static registry between tests
    const ns = Konsole.getNamespaces();
    for (const n of ns) {
      await Konsole.getLogger(n).destroy();
    }
  });

  describe('construction', () => {
    it('registers itself in the instance map', () => {
      makeSilentLogger({ namespace: 'CtorTest' });
      expect(Konsole.getNamespaces()).toContain('CtorTest');
    });

    it('returns the same instance via getLogger', () => {
      const l = makeSilentLogger({ namespace: 'GetLoggerTest' });
      expect(Konsole.getLogger('GetLoggerTest')).toBe(l);
    });

    it('warns and creates a new logger when namespace not found', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const l = Konsole.getLogger('DoesNotExist__' + Math.random());
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(l).toBeInstanceOf(Konsole);
      warnSpy.mockRestore();
    });
  });

  describe('level filtering', () => {
    it('discards entries below the minimum level', () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({ level: 'warn', transports: [spy] });

      logger.trace('ignored');
      logger.debug('ignored');
      logger.info('ignored');
      expect(spy.entries).toHaveLength(0);
    });

    it('passes entries at or above the minimum level', () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({ level: 'warn', transports: [spy] });

      logger.warn('should pass');
      logger.error('should pass');
      logger.fatal('should pass');
      expect(spy.entries).toHaveLength(3);
    });

    it('setLevel changes the filter at runtime', () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({ level: 'error', transports: [spy] });

      logger.info('before — filtered');
      expect(spy.entries).toHaveLength(0);

      logger.setLevel('info');
      logger.info('after — passes');
      expect(spy.entries).toHaveLength(1);
    });
  });

  describe('log methods', () => {
    it('all seven methods produce entries with the right level', async () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({ transports: [spy] });

      logger.trace('t');
      logger.debug('d');
      logger.info('i');
      logger.log('l');   // alias for info
      logger.warn('w');
      logger.error('e');
      logger.fatal('f');

      const levels = spy.entries.map((e) => e.level);
      expect(levels).toEqual(['trace', 'debug', 'info', 'info', 'warn', 'error', 'fatal']);
    });

    it('populates levelValue correctly', () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({ transports: [spy] });
      logger.error('boom');
      expect(spy.entries[0].levelValue).toBe(50);
    });

    it('sets the namespace on every entry', () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({ namespace: 'NS', transports: [spy] });
      logger.info('hi');
      expect(spy.entries[0].namespace).toBe('NS');
    });
  });

  describe('parseArgs calling conventions', () => {
    let spy: SpyTransport;
    let logger: Konsole;

    beforeEach(() => {
      spy = new SpyTransport();
      logger = makeSilentLogger({ transports: [spy] });
    });

    it('string only → msg set, no fields', () => {
      logger.info('hello');
      expect(spy.entries[0].msg).toBe('hello');
      expect(spy.entries[0].fields).toEqual({});
    });

    it('string + fields object → msg and fields', () => {
      logger.info('request', { userId: 1, path: '/home' });
      expect(spy.entries[0].msg).toBe('request');
      expect(spy.entries[0].fields).toMatchObject({ userId: 1, path: '/home' });
    });

    it('Pino-style object with msg key → extracts msg and spreads rest', () => {
      logger.info({ msg: 'pino', port: 3000 });
      expect(spy.entries[0].msg).toBe('pino');
      expect(spy.entries[0].fields).toMatchObject({ port: 3000 });
    });

    it('Error as first arg → msg = error.message, fields.err = Error', () => {
      const err = new Error('something broke');
      logger.error(err);
      expect(spy.entries[0].msg).toBe('something broke');
      expect(spy.entries[0].fields.err).toBe(err);
    });

    it('multiple string args → joined into msg', () => {
      logger.info('a', 'b', 'c');
      expect(spy.entries[0].msg).toBe('a b c');
    });
  });

  describe('getLogs / clearLogs', () => {
    it('getLogs returns all stored entries', () => {
      const logger = makeSilentLogger();
      logger.info('one');
      logger.info('two');
      expect(logger.getLogs()).toHaveLength(2);
    });

    it('clearLogs empties the buffer', () => {
      const logger = makeSilentLogger();
      logger.info('to be cleared');
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('reports logCount and maxLogs', () => {
      const logger = makeSilentLogger({ maxLogs: 500 });
      logger.info('a');
      logger.info('b');
      const stats = logger.getStats();
      expect(stats.logCount).toBe(2);
      expect(stats.maxLogs).toBe(500);
      expect(stats.memoryUsage).toBe('2/500 (0.4%)');
    });
  });

  describe('criteria (deprecated filter)', () => {
    it('boolean false suppresses output but still stores in buffer', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const logger = new Konsole({ namespace: 'CriteriaTest', criteria: false });

      logger.info('silent');
      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(logger.getLogs()).toHaveLength(1);
      stdoutSpy.mockRestore();
    });

    it('function criteria acts as additional output filter', () => {
      const spy = new SpyTransport();
      const logger = makeSilentLogger({
        namespace: 'FnCriteriaTest',
        transports: [spy],
      });
      // criteria is separate from transport routing — transports always get all entries
      // but output goes through criteria
      logger.setCriteria((e) => e.level === 'error');
      logger.info('filtered from output');
      logger.error('passes criteria');
      // Both are stored and forwarded to transports (transports ignore criteria)
      expect(spy.entries).toHaveLength(2);
      expect(logger.getLogs()).toHaveLength(2);
    });
  });

  describe('addTransport', () => {
    it('forwards entries to a dynamically added transport', () => {
      const logger = makeSilentLogger();
      const spy = new SpyTransport();
      logger.addTransport(spy);
      logger.info('dynamic');
      expect(spy.entries).toHaveLength(1);
      expect(spy.entries[0].msg).toBe('dynamic');
    });
  });

  describe('destroy', () => {
    it('removes the logger from the registry', async () => {
      const logger = makeSilentLogger({ namespace: 'DestroyTest' });
      expect(Konsole.getNamespaces()).toContain('DestroyTest');
      await logger.destroy();
      expect(Konsole.getNamespaces()).not.toContain('DestroyTest');
    });
  });

  describe('child loggers', () => {
    it('inherits parent namespace by default', () => {
      const spy = new SpyTransport();
      const parent = makeSilentLogger({ namespace: 'Parent', transports: [spy] });
      const child = parent.child({ component: 'db' });
      child.info('query');
      expect(spy.entries[0].namespace).toBe('Parent');
    });

    it('accepts a namespace override', () => {
      const spy = new SpyTransport();
      const parent = makeSilentLogger({ namespace: 'App', transports: [spy] });
      const child = parent.child({}, { namespace: 'App:Auth' });
      child.info('login');
      expect(spy.entries[0].namespace).toBe('App:Auth');
    });

    it('merges bindings into every entry', () => {
      const spy = new SpyTransport();
      const parent = makeSilentLogger({ transports: [spy] });
      const child = parent.child({ requestId: 'abc', ip: '1.2.3.4' });
      child.info('request started', { path: '/users' });

      const fields = spy.entries[0].fields;
      expect(fields.requestId).toBe('abc');
      expect(fields.ip).toBe('1.2.3.4');
      expect(fields.path).toBe('/users');
    });

    it('call-site fields override bindings on key collision', () => {
      const spy = new SpyTransport();
      const parent = makeSilentLogger({ transports: [spy] });
      const child = parent.child({ key: 'from-binding' });
      child.info('msg', { key: 'from-call-site' });
      expect(spy.entries[0].fields.key).toBe('from-call-site');
    });

    it('accumulates bindings through nested children', () => {
      const spy = new SpyTransport();
      const root  = makeSilentLogger({ transports: [spy] });
      const mid   = root.child({ requestId: 'r1' });
      const leaf  = mid.child({ component: 'db' });
      leaf.debug('query', { sql: 'SELECT 1' });

      const fields = spy.entries[0].fields;
      expect(fields.requestId).toBe('r1');
      expect(fields.component).toBe('db');
      expect(fields.sql).toBe('SELECT 1');
    });

    it('child level override restricts output', () => {
      const spy = new SpyTransport();
      const parent = makeSilentLogger({ level: 'trace', transports: [spy] });
      const child = parent.child({}, { level: 'error' });

      child.info('filtered');
      expect(spy.entries).toHaveLength(0);
      child.error('passes');
      expect(spy.entries).toHaveLength(1);
    });

    it('child addTransport does not affect parent', () => {
      const parentSpy = new SpyTransport();
      const childSpy  = new SpyTransport();
      const parent = makeSilentLogger({ transports: [parentSpy] });
      const child  = parent.child({});
      child.addTransport(childSpy);

      parent.info('parent only');
      child.info('child only');

      // parentSpy sees both (child shares parent's transports array copy at creation)
      // but childSpy only sees child's entry
      expect(childSpy.entries).toHaveLength(1);
      expect(childSpy.entries[0].msg).toBe('child only');

      // parentSpy.entries should only have 'parent only' + 'child only'
      // because child copies the parent transport array at creation time
      expect(parentSpy.entries.some((e) => e.msg === 'parent only')).toBe(true);
    });

    it('child is NOT registered in Konsole.instances', () => {
      const parent = makeSilentLogger({ namespace: 'ChildParent' });
      parent.child({ x: 1 });
      // Only 'ChildParent' should be in the registry, not 'ChildParent' with child bindings
      expect(Konsole.getNamespaces().filter((n) => n === 'ChildParent')).toHaveLength(1);
    });

    it('child shares the parent buffer', () => {
      const parent = makeSilentLogger({ namespace: 'SharedBuf' });
      const child = parent.child({ tag: 'c' });
      parent.info('from parent');
      child.info('from child');
      // getLogs on parent should include both entries
      expect(parent.getLogs()).toHaveLength(2);
    });
  });

  describe('enableGlobalPrint', () => {
    afterEach(() => {
      Konsole.enableGlobalPrint(false); // reset after each test
    });

    it('forces output when set to true (bypasses criteria: false)', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const logger = new Konsole({
        namespace: 'GlobalPrintTest',
        criteria: false,
        format: 'json',
      });

      Konsole.enableGlobalPrint(true);
      logger.info('forced out');
      expect(stdoutSpy).toHaveBeenCalledOnce();
      stdoutSpy.mockRestore();
    });
  });
});
