# Configuration

Konsole accepts various options to customize its behavior.

## Constructor Options

```typescript
interface KonsoleOptions {
  namespace?: string;
  criteria?: Criteria;
  defaultBatchSize?: number;
  retentionPeriod?: number;
  cleanupInterval?: number;
}
```

### namespace

- **Type:** `string`
- **Default:** `'Global'`

The identifier for this logger instance. Used for organizing and retrieving logs.

```typescript
const logger = new Konsole({ namespace: 'MyFeature' });
```

### criteria

- **Type:** `boolean | ((entry: LogEntry) => boolean)`
- **Default:** `false`

Controls when logs are printed to the console.

```typescript
// Boolean
const logger = new Konsole({ criteria: true });

// Function
const logger = new Konsole({
  criteria: (entry) => entry.logtype === 'error'
});
```

### defaultBatchSize

- **Type:** `number`
- **Default:** `100`

Number of logs to show per `viewLogs()` call.

```typescript
const logger = new Konsole({ defaultBatchSize: 50 });
```

### retentionPeriod

- **Type:** `number` (milliseconds)
- **Default:** `172800000` (48 hours)

How long to keep logs before automatic cleanup.

```typescript
// Keep logs for 24 hours
const logger = new Konsole({
  retentionPeriod: 24 * 60 * 60 * 1000
});
```

### cleanupInterval

- **Type:** `number` (milliseconds)
- **Default:** `3600000` (1 hour)

How often to check for and remove old logs.

```typescript
// Check every 30 minutes
const logger = new Konsole({
  cleanupInterval: 30 * 60 * 1000
});
```

## Full Example

```typescript
import { Konsole } from 'konsole-logger';

const logger = new Konsole({
  namespace: 'PaymentService',
  criteria: (entry) => {
    // Print errors and warnings in production
    // Print everything in development
    if (process.env.NODE_ENV === 'development') return true;
    return entry.logtype === 'error' || entry.logtype === 'warn';
  },
  defaultBatchSize: 50,
  retentionPeriod: 12 * 60 * 60 * 1000, // 12 hours
  cleanupInterval: 15 * 60 * 1000,       // 15 minutes
});
```

## Runtime Configuration

### Changing Criteria

```typescript
const logger = new Konsole({ namespace: 'App' });

// Initially silent
logger.log('Not printed');

// Enable logging
logger.setCriteria(true);
logger.log('Now printing');

// Custom criteria
logger.setCriteria((entry) => entry.messages[0] === 'IMPORTANT');
```

### Global Print

```typescript
// Enable console output globally (overrides individual criteria)
Konsole.enableGlobalPrint(true);

// Disable global print
Konsole.enableGlobalPrint(false);
```

## Cleanup

When you're done with a logger, clean it up:

```typescript
const logger = new Konsole({ namespace: 'Temporary' });

// ... use logger ...

// Clean up when done
logger.destroy();
```

This stops the cleanup interval and removes the logger from the registry.


