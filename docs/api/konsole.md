# Konsole Class

The main logging class.

## Constructor

```typescript
new Konsole(options?: KonsoleOptions)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `KonsoleOptions` | Configuration options |

### Example

```typescript
import { Konsole } from 'konsole-logger';

const logger = new Konsole({
  namespace: 'MyApp',
  criteria: true,
  defaultBatchSize: 50,
});
```

---

## Static Methods

### getLogger

```typescript
static getLogger(namespace?: string): Konsole
```

Gets an existing logger by namespace, or creates a new one if it doesn't exist.

**Parameters:**
- `namespace` — The namespace to look up (default: `'Global'`)

**Returns:** The `Konsole` instance for that namespace

**Example:**
```typescript
const logger = Konsole.getLogger('Auth');
```

---

### getNamespaces

```typescript
static getNamespaces(): string[]
```

Returns an array of all registered namespace names.

**Returns:** Array of namespace strings

**Example:**
```typescript
const namespaces = Konsole.getNamespaces();
// ['Auth', 'API', 'UI']
```

---

### exposeToWindow

```typescript
static exposeToWindow(): void
```

Exposes Konsole to the browser window as `__Konsole` for debugging.

**Example:**
```typescript
Konsole.exposeToWindow();

// In browser console:
// __Konsole.getLogger('Auth').viewLogs()
```

---

### enableGlobalPrint

```typescript
static enableGlobalPrint(enabled: boolean): void
```

Enables or disables global console output for all loggers.

**Parameters:**
- `enabled` — Whether to enable global printing

**Example:**
```typescript
Konsole.enableGlobalPrint(true);  // All logs print
Konsole.enableGlobalPrint(false); // Return to normal
```

---

## Instance Methods

### log

```typescript
log(...args: unknown[]): void
```

Logs a standard message.

**Parameters:**
- `args` — Values to log

**Example:**
```typescript
logger.log('User action', { userId: 123 });
```

---

### error

```typescript
error(...args: unknown[]): void
```

Logs an error message.

**Parameters:**
- `args` — Values to log

**Example:**
```typescript
logger.error('Failed to fetch', error);
```

---

### warn

```typescript
warn(...args: unknown[]): void
```

Logs a warning message.

**Parameters:**
- `args` — Values to log

**Example:**
```typescript
logger.warn('Deprecated API used');
```

---

### info

```typescript
info(...args: unknown[]): void
```

Logs an info message.

**Parameters:**
- `args` — Values to log

**Example:**
```typescript
logger.info('Connected to server');
```

---

### viewLogs

```typescript
viewLogs(batchSize?: number): void
```

Displays stored logs in the console using `console.table`.

**Parameters:**
- `batchSize` — Number of logs to display (default: `defaultBatchSize`)

**Example:**
```typescript
logger.viewLogs();     // Default batch
logger.viewLogs(50);   // Custom batch size
```

---

### getLogs

```typescript
getLogs(): ReadonlyArray<LogEntry>
```

Returns all stored logs as a read-only array.

**Returns:** Array of `LogEntry` objects

**Example:**
```typescript
const logs = logger.getLogs();
const errors = logs.filter(l => l.logtype === 'error');
```

---

### clearLogs

```typescript
clearLogs(): void
```

Removes all stored logs and resets the batch position.

**Example:**
```typescript
logger.clearLogs();
```

---

### resetBatch

```typescript
resetBatch(): void
```

Resets the batch position for `viewLogs()` to the beginning.

**Example:**
```typescript
logger.viewLogs(); // View batch 1
logger.resetBatch();
logger.viewLogs(); // View batch 1 again
```

---

### setCriteria

```typescript
setCriteria(criteria: Criteria): void
```

Updates the logging criteria at runtime.

**Parameters:**
- `criteria` — New criteria value

**Example:**
```typescript
logger.setCriteria(true);
logger.setCriteria((entry) => entry.logtype === 'error');
```

---

### destroy

```typescript
destroy(): void
```

Cleans up the logger instance, stopping the cleanup interval and removing it from the registry.

**Example:**
```typescript
const temp = new Konsole({ namespace: 'Temp' });
// ... use logger ...
temp.destroy();
```


