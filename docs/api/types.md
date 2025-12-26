# Types

Type definitions exported by Konsole.

## LogEntry

Represents a single log entry with metadata.

```typescript
type LogEntry = {
  messages: unknown[];
  timestamp: Date;
  namespace: string;
  logtype?: 'log' | 'error' | 'warn' | 'info';
};
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `unknown[]` | The arguments passed to the log method |
| `timestamp` | `Date` | When the log was created |
| `namespace` | `string` | The namespace of the logger |
| `logtype` | `string?` | The type of log: `'log'`, `'error'`, `'warn'`, or `'info'` |

### Example

```typescript
import { Konsole, LogEntry } from 'konsole-logger';

const logger = new Konsole({ namespace: 'App' });
logger.error('Something failed', { code: 500 });

const logs: LogEntry[] = logger.getLogs();
// [{
//   messages: ['Something failed', { code: 500 }],
//   timestamp: Date,
//   namespace: 'App',
//   logtype: 'error'
// }]
```

---

## Criteria

Type for conditional logging. Can be a boolean or a predicate function.

```typescript
type Criteria = boolean | ((logEntry: LogEntry) => boolean);
```

### Usage

```typescript
import { Konsole, Criteria, LogEntry } from 'konsole-logger';

// Boolean criteria
const alwaysPrint: Criteria = true;
const neverPrint: Criteria = false;

// Function criteria
const onlyErrors: Criteria = (entry: LogEntry) => 
  entry.logtype === 'error';

const onlyRecent: Criteria = (entry: LogEntry) =>
  entry.timestamp > new Date(Date.now() - 60000);

const logger = new Konsole({
  namespace: 'App',
  criteria: onlyErrors,
});
```

---

## KonsoleOptions

Configuration options for the Konsole constructor.

```typescript
interface KonsoleOptions {
  namespace?: string;
  criteria?: Criteria;
  defaultBatchSize?: number;
  retentionPeriod?: number;
  cleanupInterval?: number;
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `namespace` | `string` | `'Global'` | Logger namespace identifier |
| `criteria` | `Criteria` | `false` | When to print logs to console |
| `defaultBatchSize` | `number` | `100` | Logs per `viewLogs()` call |
| `retentionPeriod` | `number` | `172800000` | Log retention (48h in ms) |
| `cleanupInterval` | `number` | `3600000` | Cleanup check interval (1h in ms) |

### Example

```typescript
import { Konsole, KonsoleOptions } from 'konsole-logger';

const options: KonsoleOptions = {
  namespace: 'PaymentService',
  criteria: (entry) => entry.logtype === 'error',
  defaultBatchSize: 50,
  retentionPeriod: 24 * 60 * 60 * 1000,
  cleanupInterval: 30 * 60 * 1000,
};

const logger = new Konsole(options);
```

---

## KonsolePublic

Public interface for Konsole, used when exposing to window.

```typescript
interface KonsolePublic {
  viewLogs(batchSize?: number): void;
}
```

This interface limits what methods are available through `__Konsole.getLogger()` in the browser console.


