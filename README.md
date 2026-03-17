# Konsole

<div align="center">

**Structured, namespaced logging for browser and Node.js**

[![npm version](https://img.shields.io/npm/v/konsole-logger.svg)](https://www.npmjs.com/package/konsole-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

- **Browser + Node.js** — works everywhere without configuration
- **Six numeric log levels** — trace / debug / info / warn / error / fatal
- **Structured output** — consistent JSON schema, compatible with Datadog, Loki, CloudWatch
- **Beautiful terminal output** — ANSI colors on TTY, NDJSON in pipes, styled badges in DevTools
- **Child loggers** — attach request-scoped context that flows into every log line
- **Flexible transports** — HTTP, file, stream, or console; per-transport filter and transform
- **Circular buffer** — memory-efficient in-process log history
- **TypeScript first** — full type safety, zero runtime dependencies

## Installation

```bash
npm install konsole-logger
```

```bash
yarn add konsole-logger
```

```bash
pnpm add konsole-logger
```

## Quick Start

```typescript
import { Konsole } from 'konsole-logger';

const logger = new Konsole({ namespace: 'MyApp' });

logger.info('Server started', { port: 3000 });
logger.warn('Config file missing, using defaults');
logger.error(new Error('Database connection failed'));
```

**Terminal output (TTY):**
```
10:23:45  INF  [MyApp]  Server started  port=3000
10:23:45  WRN  [MyApp]  Config file missing, using defaults
10:23:45  ERR  [MyApp]  Database connection failed
```

**Pipe / CI output (NDJSON):**
```json
{"level":30,"levelName":"info","time":"2025-03-16T10:23:45.000Z","namespace":"MyApp","msg":"Server started","port":3000}
```

## Log Levels

| Method | Level | Value |
|--------|-------|-------|
| `logger.trace()` | trace | 10 |
| `logger.debug()` | debug | 20 |
| `logger.info()` / `logger.log()` | info | 30 |
| `logger.warn()` | warn | 40 |
| `logger.error()` | error | 50 |
| `logger.fatal()` | fatal | 60 |

Set a minimum threshold — entries below it are discarded entirely:

```typescript
const logger = new Konsole({ namespace: 'App', level: 'info' });

logger.trace('loop tick');   // dropped — below threshold
logger.debug('cache miss');  // dropped — below threshold
logger.info('ready');        // ✅ logged
```

Change the threshold at runtime:

```typescript
logger.setLevel('debug');
```

## Calling Conventions

All four styles work and produce the same structured `LogEntry`:

```typescript
// 1. Simple string
logger.info('Server started');

// 2. String + fields (recommended)
logger.info('Request received', { method: 'GET', path: '/users', ms: 42 });

// 3. Object-first with msg key
logger.info({ msg: 'Request received', method: 'GET', path: '/users' });

// 4. Error — message extracted, error stored in fields.err
logger.error(new Error('Connection refused'));
```

## Output Formats

The `format` option controls how logs are printed. `'auto'` (default) picks the right one for the environment:

| Format | Description |
|--------|-------------|
| `'auto'` | Browser → `browser`, Node.js TTY → `pretty`, Node.js pipe → `json` |
| `'pretty'` | ANSI-colored human-readable output |
| `'json'` | Newline-delimited JSON — aggregator-friendly |
| `'text'` | Plain text, no ANSI — for CI or log files |
| `'browser'` | Styled `%c` badges in DevTools |
| `'silent'` | No output; logs still stored in the buffer and sent to transports |

```typescript
const logger = new Konsole({ namespace: 'App', format: 'silent' });
```

## Child Loggers

Create a child that automatically injects context into every entry it produces:

```typescript
const logger = new Konsole({ namespace: 'API' });

// Per-request child
const req = logger.child({ requestId: 'req_abc', userId: 42 });

req.info('Request started', { path: '/users' });
// → INF [API]  Request started  requestId=req_abc  userId=42  path=/users

// Nest further — bindings accumulate
const db = req.child({ component: 'postgres' });
db.debug('Query', { ms: 4 });
// → DBG [API]  Query  requestId=req_abc  userId=42  component=postgres  ms=4
```

Child options:

```typescript
const child = logger.child(
  { requestId: 'req_abc' },
  { namespace: 'API:handler', level: 'warn' }
);
```

Children are ephemeral — not registered in `Konsole.instances`, share the parent's buffer.

## Transports

Ship logs to external destinations alongside (or instead of) console output:

### HTTP

```typescript
const logger = new Konsole({
  namespace: 'App',
  transports: [
    {
      name: 'datadog',
      url: 'https://http-intake.logs.datadoghq.com/v1/input',
      headers: { 'DD-API-KEY': process.env.DD_API_KEY },
      batchSize: 50,
      flushInterval: 10000,
      filter: (entry) => entry.levelValue >= 40, // warn+ only
    },
  ],
});
```

### File (Node.js)

```typescript
import { Konsole, FileTransport } from 'konsole-logger';

const logger = new Konsole({
  namespace: 'App',
  transports: [
    new FileTransport({ path: '/var/log/app.log' }),
  ],
});
```

### Stream

```typescript
import { StreamTransport } from 'konsole-logger';

const logger = new Konsole({
  namespace: 'App',
  transports: [new StreamTransport({ stream: process.stdout, format: 'json' })],
});
```

### Add at runtime

```typescript
logger.addTransport(new FileTransport({ path: './debug.log' }));
```

### Flush before exit (Node.js)

```typescript
process.on('SIGTERM', async () => {
  await logger.flushTransports();
  process.exit(0);
});
```

## Configuration

```typescript
new Konsole({
  namespace?: string;          // default: 'Global'
  level?: LogLevelName;        // default: 'trace' (no filtering)
  format?: KonsoleFormat;      // default: 'auto'
  transports?: (Transport | TransportConfig)[];
  maxLogs?: number;            // default: 10000 (circular buffer size)
  defaultBatchSize?: number;   // default: 100 (viewLogs batch)
  retentionPeriod?: number;    // default: 172800000 (48 hours)
  cleanupInterval?: number;    // default: 3600000 (1 hour)
  useWorker?: boolean;         // default: false (browser only)
})
```

## API Reference

### Instance methods

| Method | Description |
|--------|-------------|
| `trace / debug / info / log / warn / error / fatal` | Log at the given level |
| `child(bindings, options?)` | Create a child logger with merged bindings |
| `setLevel(level)` | Change minimum level at runtime |
| `getLogs()` | Return all entries from the circular buffer |
| `getLogsAsync()` | Async variant (for Web Worker mode) |
| `clearLogs()` | Empty the buffer |
| `viewLogs(batchSize?)` | Print a batch of stored logs to the console |
| `getStats()` | `{ logCount, capacity }` |
| `addTransport(transport)` | Attach a transport at runtime |
| `flushTransports()` | Flush all pending batches |
| `destroy()` | Flush, stop timers, deregister |

### Static methods

| Method | Description |
|--------|-------------|
| `Konsole.getLogger(namespace)` | Retrieve a registered logger |
| `Konsole.getNamespaces()` | List all registered namespaces |
| `Konsole.exposeToWindow()` | Expose `__Konsole` on `window` for browser debugging |
| `Konsole.enableGlobalPrint(enabled)` | Override output for all loggers |
| `Konsole.addGlobalTransport(transport)` | Add a transport to all existing loggers |

## Browser Debugging

```typescript
// In app init:
Konsole.exposeToWindow();

// Then in DevTools console:
__Konsole.getLogger('Auth').viewLogs()
__Konsole.enableGlobalPrint(true)   // unsilence all loggers
```

## Requirements

- **Node.js ≥ 18** for server-side use (native `fetch`). Older versions must pass `fetchImpl` to `TransportConfig`.
- `useWorker: true` is browser-only — silently ignored in Node.js.

## License

MIT © Sakti Kumar Chourasia

---

<div align="center">

🐛 [Report Bug](https://github.com/shakcho/Konsole/issues) · ✨ [Request Feature](https://github.com/shakcho/Konsole/issues)

</div>
