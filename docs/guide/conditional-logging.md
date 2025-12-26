# Conditional Logging

Konsole allows you to control when logs are printed to the console using the `criteria` option.

## Boolean Criteria

The simplest form of criteria is a boolean:

```typescript
import { Konsole } from 'konsole-logger';

// Always print to console
const verboseLogger = new Konsole({
  namespace: 'Verbose',
  criteria: true,
});

// Never print to console (only store)
const silentLogger = new Konsole({
  namespace: 'Silent',
  criteria: false, // This is the default
});
```

## Function Criteria

For more control, use a function that receives the log entry:

```typescript
import { Konsole, LogEntry } from 'konsole-logger';

// Only print errors
const errorLogger = new Konsole({
  namespace: 'App',
  criteria: (entry: LogEntry) => entry.logtype === 'error',
});

errorLogger.log('This is stored but not printed');
errorLogger.error('This is stored AND printed!');
```

### LogEntry Structure

```typescript
interface LogEntry {
  messages: unknown[];  // The logged arguments
  timestamp: Date;      // When the log was created
  namespace: string;    // The logger namespace
  logtype?: 'log' | 'error' | 'warn' | 'info';
}
```

## Dynamic Criteria

Change criteria at runtime using `setCriteria`:

```typescript
const logger = new Konsole({ namespace: 'App' });

// Start silent
logger.log('Not printed');

// Enable logging
logger.setCriteria(true);
logger.log('Now this prints!');

// Custom criteria
logger.setCriteria((entry) => entry.messages[0]?.includes?.('important'));
logger.log('regular message'); // Not printed
logger.log('important: check this'); // Printed!
```

## Environment-Based Logging

A common pattern is to enable logging based on environment:

```typescript
const isDev = process.env.NODE_ENV === 'development';

const logger = new Konsole({
  namespace: 'App',
  criteria: isDev,
});

// Logs print in development, stay silent in production
logger.log('Debug info');
```

## Global Enable/Disable

Enable or disable console output globally:

```typescript
import { Konsole } from 'konsole-logger';

// Enable all logging
Konsole.enableGlobalPrint(true);

// Disable all logging
Konsole.enableGlobalPrint(false);
```

::: tip
Global print takes precedence over individual criteria. When enabled, all logs from all namespaces will print.
:::


