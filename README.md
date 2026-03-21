# Konsole

<div align="center">

**Structured, namespaced logging for browser and Node.js**

[![npm version](https://img.shields.io/npm/v/konsole-logger.svg)](https://www.npmjs.com/package/konsole-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

- **Browser-first, Node.js ready** — works everywhere; Web Worker transport keeps the UI thread free
- **Six numeric log levels** — trace / debug / info / warn / error / fatal
- **Structured output** — consistent JSON schema, compatible with Datadog, Loki, CloudWatch
- **Beautiful terminal output** — ANSI colors on TTY, NDJSON in pipes, styled badges in DevTools
- **Configurable timestamps** — full date+time by default, ISO 8601, epoch, nanosecond precision, or custom format
- **Child loggers** — attach request-scoped context that flows into every log line
- **Flexible transports** — HTTP, file, stream, or console; per-transport filter and transform
- **Circular buffer** — memory-efficient in-process log history (browser); zero-overhead in Node.js
- **Fast** — on par with Pino, significantly faster than Winston and Bunyan, at 1/3 the bundle size
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
2025-03-16 10:23:45.123  INF  [MyApp]  Server started  port=3000
2025-03-16 10:23:45.124  WRN  [MyApp]  Config file missing, using defaults
2025-03-16 10:23:45.125  ERR  [MyApp]  Database connection failed
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

## Timestamps

Every log line includes a full date+time timestamp by default (`2025-03-16 10:23:45.123`). Configure the format per-logger:

| Preset | Output |
|--------|--------|
| `'datetime'` *(default)* | `2025-03-16 10:23:45.123` |
| `'iso'` | `2025-03-16T10:23:45.123Z` |
| `'time'` | `10:23:45.123` |
| `'date'` | `2025-03-16` |
| `'unix'` | `1710583425` |
| `'unixMs'` | `1710583425123` |
| `'none'` | *(omitted)* |
| `(date, hrTime?) => string` | Custom function |

```typescript
// ISO timestamps everywhere
const logger = new Konsole({ namespace: 'App', timestamp: 'iso' });

// High-resolution timestamps (nanosecond precision)
const logger = new Konsole({
  namespace: 'App',
  timestamp: { format: 'iso', highResolution: true },
});

// Change at runtime (works in browser too)
logger.setTimestamp('unixMs');
logger.setTimestamp((d) => d.toLocaleString('ja-JP'));
```

### Browser runtime control

```typescript
// Via window.__Konsole (after exposeToWindow())
__Konsole.setTimestamp('iso')                    // all loggers
__Konsole.getLogger('Auth').setTimestamp('iso')   // specific logger
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
  timestamp?: TimestampFormat | TimestampOptions; // default: 'datetime'
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
| `setTimestamp(format)` | Change timestamp format at runtime |
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
__Konsole.setTimestamp('iso')       // switch all loggers to ISO timestamps
__Konsole.getLogger('Auth').setTimestamp('time') // per-logger override
```

## Performance

Konsole is designed to have minimal overhead. Unlike Pino, Winston, and Bunyan (Node.js only), Konsole works natively in the browser with Web Worker offloading for non-blocking transport processing.

Benchmarked on Apple M2 Max, Node.js v23 (100K iterations):

| Scenario | Konsole | Pino | Winston | Bunyan |
|---|---:|---:|---:|---:|
| Disabled / silent | ~8M | ~7M | ~1.5M | — |
| JSON → /dev/null | ~650K | ~470K | ~270K | ~340K |
| Child (disabled) | ~17M | ~14M | ~2M | — |

| | Konsole | Pino | Winston | Bunyan |
|---|---:|---:|---:|---:|
| **Bundle (gzip)** | **~10 KB** | ~32 KB | ~70 KB | ~45 KB |
| **Install size** | **86 KB** | 1.17 MB | 360 KB | 212 KB |
| **Dependencies** | **0** | 11 | 11 | 0 |
| **Browser support** | **Native + Web Worker** | No | No | No |

> Run `npm run benchmark` to reproduce on your hardware. Install competitors with `npm install --no-save pino winston bunyan`.

### Browser Performance

With `useWorker: true`, log storage and HTTP transport batching run on a Web Worker — the main thread never blocks on logging:

```typescript
const logger = new Konsole({
  namespace: 'App',
  useWorker: true,
  transports: [{
    name: 'backend',
    url: '/api/logs',
    batchSize: 50,
    flushInterval: 10000,
  }],
});

// Logging never blocks rendering — processed in background
logger.info('User action', { event: 'click', target: 'checkout' });
```

No other structured logging library offers this.

## Requirements

- **Node.js ≥ 18** for server-side use (native `fetch`). Older versions must pass `fetchImpl` to `TransportConfig`.
- `useWorker: true` is browser-only — silently ignored in Node.js.

## License

MIT © Sakti Kumar Chourasia

---

<div align="center">

🐛 [Report Bug](https://github.com/shakcho/Konsole/issues) · ✨ [Request Feature](https://github.com/shakcho/Konsole/issues)

</div>
