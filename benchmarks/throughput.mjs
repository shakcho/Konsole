#!/usr/bin/env node

/**
 * Konsole performance benchmark — throughput & latency
 *
 * Compares Konsole against Pino, Winston, and Bunyan (when installed).
 * Install competitors first:
 *   npm install --no-save pino winston bunyan
 *
 * Run:
 *   node benchmarks/throughput.mjs
 */

import { performance } from 'node:perf_hooks';
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// ─── Config ──────────────────────────────────────────────────────────────────

const ITERATIONS = 100_000;
const WARMUP = 1_000;
const FIELDS = { userId: 42, requestId: 'req_abc123', method: 'GET', path: '/api/users', ms: 127 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function devNull() {
  return createWriteStream('/dev/null');
}

function tmpFile(name) {
  return path.join(os.tmpdir(), `konsole-bench-${name}-${Date.now()}.log`);
}

function formatOps(ops) {
  if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M ops/sec`;
  if (ops >= 1_000) return `${(ops / 1_000).toFixed(1)}K ops/sec`;
  return `${ops.toFixed(0)} ops/sec`;
}

function formatNs(ns) {
  if (ns >= 1_000_000) return `${(ns / 1_000_000).toFixed(2)} ms`;
  if (ns >= 1_000) return `${(ns / 1_000).toFixed(2)} µs`;
  return `${ns.toFixed(0)} ns`;
}

function percentile(sorted, p) {
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}

async function runBench(name, logFn, opts = {}) {
  const iterations = opts.iterations ?? ITERATIONS;
  const warmup = opts.warmup ?? WARMUP;

  // Warmup
  for (let i = 0; i < warmup; i++) logFn(i);

  // Collect latencies
  const latencies = new Float64Array(iterations);
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    logFn(i);
    latencies[i] = (performance.now() - t0) * 1_000_000; // ns
  }

  const elapsed = performance.now() - start;
  const opsPerSec = (iterations / elapsed) * 1000;

  // Sort for percentiles
  const sorted = Array.from(latencies).sort((a, b) => a - b);

  return {
    name,
    iterations,
    elapsed: `${elapsed.toFixed(0)} ms`,
    opsPerSec: formatOps(opsPerSec),
    opsPerSecRaw: opsPerSec,
    p50: formatNs(percentile(sorted, 0.5)),
    p95: formatNs(percentile(sorted, 0.95)),
    p99: formatNs(percentile(sorted, 0.99)),
  };
}

// ─── Load loggers ────────────────────────────────────────────────────────────

async function tryImport(pkg) {
  try {
    return await import(pkg);
  } catch {
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│  Konsole Performance Benchmark                      │');
  console.log('│  Throughput & Latency vs. Popular Loggers           │');
  console.log('└─────────────────────────────────────────────────────┘');
  console.log('');
  console.log(`  Platform:    ${os.platform()} ${os.arch()}`);
  console.log(`  Node.js:     ${process.version}`);
  console.log(`  CPU:         ${os.cpus()[0]?.model ?? 'unknown'}`);
  console.log(`  Iterations:  ${ITERATIONS.toLocaleString()}`);
  console.log('');

  const results = [];

  // ── Konsole ──────────────────────────────────────────────────────────────

  const { Konsole, StreamTransport } = await import('../dist/konsole.js');

  // Silent mode with buffer (browser-like)
  {
    const logger = new Konsole({ namespace: 'Bench', format: 'silent', maxLogs: 10, buffer: true });
    results.push(await runBench('Konsole (silent+buffer)', (i) => logger.info('Hello world', { i, ...FIELDS })));
    await logger.destroy();
  }

  // Silent mode without buffer (Node.js default — no buffer, no I/O)
  {
    const logger = new Konsole({ namespace: 'BenchNoBuf', format: 'silent', buffer: false });
    results.push(await runBench('Konsole (silent, no buffer)', (i) => logger.info('Hello world', { i, ...FIELDS })));
    await logger.destroy();
  }

  // JSON to /dev/null (Node.js production path)
  {
    const devnull = devNull();
    const logger = new Konsole({
      namespace: 'BenchJson',
      format: 'silent',
      buffer: false,
      transports: [new StreamTransport({ stream: devnull, format: 'json' })],
    });
    results.push(await runBench('Konsole (JSON → /dev/null)', (i) => logger.info('Hello world', { i, ...FIELDS })));
    await logger.destroy();
    devnull.end();
  }

  // Child logger with buffer (browser-like)
  {
    const logger = new Konsole({ namespace: 'BenchChild', format: 'silent', maxLogs: 10, buffer: true });
    const child = logger.child({ requestId: 'req_xyz', userId: 99 });
    results.push(await runBench('Konsole (child+buffer)', (i) => child.info('Hello world', { i, path: '/users' })));
    await logger.destroy();
  }

  // Child logger without buffer (Node.js default)
  {
    const logger = new Konsole({ namespace: 'BenchChildNb', format: 'silent', buffer: false });
    const child = logger.child({ requestId: 'req_xyz', userId: 99 });
    results.push(await runBench('Konsole (child, no buffer)', (i) => child.info('Hello world', { i, path: '/users' })));
    await logger.destroy();
  }

  // ── Pino ─────────────────────────────────────────────────────────────────

  const pino = await tryImport('pino');
  if (pino) {
    // Silent
    {
      const logger = pino.default({ level: 'trace', enabled: false });
      results.push(await runBench('Pino (disabled)', (i) => logger.info({ i, ...FIELDS }, 'Hello world')));
    }

    // JSON to /dev/null
    {
      const dest = pino.destination?.('/dev/null') ?? devNull();
      const logger = pino.default({ level: 'trace' }, dest);
      results.push(await runBench('Pino (JSON → /dev/null)', (i) => logger.info({ i, ...FIELDS }, 'Hello world')));
    }

    // Child
    {
      const logger = pino.default({ level: 'trace', enabled: false });
      const child = logger.child({ requestId: 'req_xyz', userId: 99 });
      results.push(await runBench('Pino (child, disabled)', (i) => child.info({ i, path: '/users' }, 'Hello world')));
    }
  } else {
    console.log('  ⚠ Pino not installed — skipping (npm install --no-save pino)');
  }

  // ── Winston ──────────────────────────────────────────────────────────────

  const winston = await tryImport('winston');
  if (winston) {
    // Silent
    {
      const logger = winston.default.createLogger({ silent: true });
      results.push(await runBench('Winston (silent)', (i) => logger.info('Hello world', { i, ...FIELDS })));
    }

    // JSON to /dev/null
    {
      const logger = winston.default.createLogger({
        level: 'info',
        format: winston.default.format.json(),
        transports: [new winston.default.transports.Stream({ stream: devNull() })],
      });
      results.push(await runBench('Winston (JSON → /dev/null)', (i) => logger.info('Hello world', { i, ...FIELDS })));
    }

    // Child
    {
      const logger = winston.default.createLogger({ silent: true });
      const child = logger.child({ requestId: 'req_xyz', userId: 99 });
      results.push(await runBench('Winston (child, silent)', (i) => child.info('Hello world', { i, path: '/users' })));
    }
  } else {
    console.log('  ⚠ Winston not installed — skipping (npm install --no-save winston)');
  }

  // ── Bunyan ───────────────────────────────────────────────────────────────

  const bunyan = await tryImport('bunyan');
  if (bunyan) {
    // JSON to /dev/null
    {
      const logger = bunyan.default.createLogger({ name: 'bench', stream: devNull() });
      results.push(await runBench('Bunyan (JSON → /dev/null)', (i) => logger.info({ i, ...FIELDS }, 'Hello world')));
    }

    // Child
    {
      const logger = bunyan.default.createLogger({ name: 'bench', stream: devNull() });
      const child = logger.child({ requestId: 'req_xyz', userId: 99 });
      results.push(await runBench('Bunyan (child → /dev/null)', (i) => child.info({ i, path: '/users' }, 'Hello world')));
    }
  } else {
    console.log('  ⚠ Bunyan not installed — skipping (npm install --no-save bunyan)');
  }

  // ── Print results ────────────────────────────────────────────────────────

  console.log('');
  console.log('─── Throughput & Latency ─────────────────────────────────────────');
  console.log('');
  console.table(results.map(({ name, opsPerSec, p50, p95, p99, elapsed }) => ({
    Logger: name,
    'ops/sec': opsPerSec,
    'p50': p50,
    'p95': p95,
    'p99': p99,
    'Total': elapsed,
  })));

  // ── Bundle size comparison ───────────────────────────────────────────────

  console.log('');
  console.log('─── Bundle / Install Size ───────────────────────────────────────');
  console.log('');

  const sizes = [
    { Logger: 'Konsole', 'ESM (min)': '34 KB', 'Gzip': '~10 KB', 'Dependencies': '0', 'Note': 'Zero-dep, ESM+UMD' },
  ];

  if (pino) sizes.push({ Logger: 'Pino', 'ESM (min)': 'N/A (CJS)', 'Gzip': '~32 KB', 'Dependencies': '5+', 'Note': 'sonic-boom, fast-redact, etc.' });
  if (winston) sizes.push({ Logger: 'Winston', 'ESM (min)': 'N/A (CJS)', 'Gzip': '~70 KB', 'Dependencies': '10+', 'Note': 'logform, triple-beam, etc.' });
  if (bunyan) sizes.push({ Logger: 'Bunyan', 'ESM (min)': 'N/A (CJS)', 'Gzip': '~45 KB', 'Dependencies': '3+', 'Note': 'dtrace-provider optional' });

  sizes.push({ Logger: 'console.log', 'ESM (min)': '0 KB', 'Gzip': '0 KB', 'Dependencies': '0', 'Note': 'No structure, no levels, no transports' });

  console.table(sizes);

  // ── Memory benchmark ──────────────────────────────────────────────────

  console.log('');
  console.log('─── Memory Usage (100K entries) ─────────────────────────────────');
  console.log('');

  global.gc?.();
  const memBefore = process.memoryUsage().rss;

  const memLogger = new Konsole({ namespace: 'MemBench', format: 'silent', maxLogs: 100_000 });
  for (let i = 0; i < 100_000; i++) {
    memLogger.info('Memory test entry', { i, ...FIELDS });
  }

  global.gc?.();
  const memAfter = process.memoryUsage().rss;
  const memDelta = memAfter - memBefore;

  console.log(`  RSS before:  ${(memBefore / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  RSS after:   ${(memAfter / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Delta:       ${(memDelta / 1024 / 1024).toFixed(1)} MB for 100K entries`);
  console.log(`  Per entry:   ~${(memDelta / 100_000).toFixed(0)} bytes`);
  console.log('');

  // With circular buffer capping
  const memLogger2 = new Konsole({ namespace: 'MemBench2', format: 'silent', maxLogs: 10_000 });
  global.gc?.();
  const memCappedBefore = process.memoryUsage().rss;

  for (let i = 0; i < 100_000; i++) {
    memLogger2.info('Memory test capped', { i, ...FIELDS });
  }

  global.gc?.();
  const memCappedAfter = process.memoryUsage().rss;
  const memCappedDelta = memCappedAfter - memCappedBefore;

  console.log(`  With maxLogs=10K (100K writes, 10K retained):`);
  console.log(`  Delta:       ${(memCappedDelta / 1024 / 1024).toFixed(1)} MB`);
  console.log('');

  await memLogger.destroy();
  await memLogger2.destroy();

  console.log('Done.');
}

main().catch(console.error);
