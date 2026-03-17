# Types

Type definitions exported by `konsole-logger`.

## LogEntry

Represents a single log entry stored in the circular buffer.

```typescript
type LogEntry = {
  msg: string;                       // primary message string
  messages: unknown[];               // original arguments (kept for compatibility)
  fields: Record<string, unknown>;   // structured key-value pairs (includes bindings)
  timestamp: Date;
  namespace: string;
  level: LogLevelName;               // 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  levelValue: number;                // 10 | 20 | 30 | 40 | 50 | 60
  logtype?: string;                  // @deprecated — use level
};
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `msg` | `string` | The primary log message |
| `messages` | `unknown[]` | Original arguments passed to the log method |
| `fields` | `Record<string, unknown>` | Structured key-value pairs (child bindings merged with call-site fields) |
| `timestamp` | `Date` | When the log was created |
| `namespace` | `string` | The logger namespace |
| `level` | `LogLevelName` | Severity: `'trace'` `'debug'` `'info'` `'warn'` `'error'` `'fatal'` |
| `levelValue` | `number` | Numeric severity: 10 / 20 / 30 / 40 / 50 / 60 |

### Example

```typescript
import { Konsole } from 'konsole-logger';

const logger = new Konsole({ namespace: 'App', format: 'silent' });
logger.error('Something failed', { code: 500, path: '/users' });

const [entry] = logger.getLogs();
// {
//   msg: 'Something failed',
//   messages: ['Something failed', { code: 500, path: '/users' }],
//   fields: { code: 500, path: '/users' },
//   timestamp: Date,
//   namespace: 'App',
//   level: 'error',
//   levelValue: 50,
// }
```

---

## Transport *(interface)*

All transport implementations satisfy this interface.

```typescript
interface Transport {
  readonly name: string;
  write(entry: LogEntry): void;
  flush?(): Promise<void>;
  destroy(): Promise<void>;
}
```

### Implementing a custom transport

```typescript
import type { Transport, LogEntry } from 'konsole-logger';

class MyTransport implements Transport {
  readonly name = 'my-transport';

  write(entry: LogEntry): void {
    // deliver the entry somewhere
    externalService.send({
      level: entry.level,
      msg: entry.msg,
      ...entry.fields,
    });
  }

  async destroy(): Promise<void> {
    // clean up resources
  }
}

const logger = new Konsole({
  namespace: 'App',
  transports: [new MyTransport()],
});
```

---

## KonsoleOptions

Configuration for the `Konsole` constructor.

```typescript
interface KonsoleOptions {
  namespace?: string;
  level?: LogLevelName;
  format?: KonsoleFormat;
  transports?: (Transport | TransportConfig)[];
  maxLogs?: number;
  defaultBatchSize?: number;
  retentionPeriod?: number;
  cleanupInterval?: number;
  useWorker?: boolean;
  criteria?: Criteria; // @deprecated
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `namespace` | `string` | `'Global'` | Logger namespace |
| `level` | `LogLevelName` | `'trace'` | Minimum level — entries below are discarded |
| `format` | `KonsoleFormat` | `'auto'` | Output format (see below) |
| `transports` | `(Transport \| TransportConfig)[]` | `[]` | External log destinations |
| `maxLogs` | `number` | `10000` | Circular buffer capacity |
| `defaultBatchSize` | `number` | `100` | Entries per `viewLogs()` call |
| `retentionPeriod` | `number` | `172800000` | 48 hours in ms |
| `cleanupInterval` | `number` | `3600000` | 1 hour in ms |
| `useWorker` | `boolean` | `false` | Web Worker mode (browser only) |
| `criteria` | `Criteria` | `true` | Output filter *(deprecated — use `level` and `format`)* |

---

## KonsoleFormat

```typescript
type KonsoleFormat = 'auto' | 'pretty' | 'json' | 'text' | 'browser' | 'silent';
```

| Value | Description |
|-------|-------------|
| `'auto'` | Browser → `browser`, Node.js TTY → `pretty`, Node.js pipe → `json` |
| `'pretty'` | ANSI-colored human-readable output; respects `NO_COLOR` / `FORCE_COLOR` |
| `'json'` | Newline-delimited JSON — aggregator-friendly (Datadog, Loki, CloudWatch) |
| `'text'` | Plain text, no ANSI — for CI logs or plain log files |
| `'browser'` | `%c` CSS badge styling in browser DevTools |
| `'silent'` | No output; entries still stored in buffer and forwarded to transports |

---

## KonsoleChildOptions

Options accepted by `logger.child()`.

```typescript
interface KonsoleChildOptions {
  namespace?: string;
  level?: LogLevelName;
}
```

---

## TransportConfig

Configuration for an HTTP transport (auto-wrapped in `HttpTransport`).

```typescript
interface TransportConfig {
  name: string;
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  retryAttempts?: number;
  filter?: (entry: LogEntry) => boolean;
  transform?: (entry: LogEntry) => unknown;
  fetchImpl?: typeof fetch;
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | Required | Unique identifier |
| `url` | `string` | Required | Endpoint URL |
| `method` | `string` | `'POST'` | HTTP method |
| `headers` | `object` | `{}` | Additional request headers |
| `batchSize` | `number` | `50` | Entries per batch |
| `flushInterval` | `number` | `10000` | Auto-flush interval (ms) |
| `retryAttempts` | `number` | `3` | Retry attempts with exponential backoff |
| `filter` | `function` | — | Only forward entries matching predicate |
| `transform` | `function` | — | Transform entry before sending |
| `fetchImpl` | `typeof fetch` | `globalThis.fetch` | Custom fetch (required on Node.js < 18) |

---

## Criteria *(deprecated)*

```typescript
type Criteria = boolean | ((logEntry: LogEntry) => boolean);
```

Controls whether the formatter outputs a log entry. Prefer `level` and `format` for new code.

---

## LogLevelName

```typescript
type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
```

---

## FileFormat

```typescript
type FileFormat = 'json' | 'text';
```

Used by `FileTransport` and `StreamTransport` to control the per-line serialization format.

---

## KonsolePublic

Public interface surfaced by `__Konsole.getLogger()` in the browser — limits what untrusted code can do.

```typescript
interface KonsolePublic {
  viewLogs(batchSize?: number): void;
}
```
