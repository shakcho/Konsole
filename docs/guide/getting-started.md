# Getting Started

## Installation

Install Konsole using your preferred package manager:

::: code-group

```bash [npm]
npm install konsole-logger
```

```bash [yarn]
yarn add konsole-logger
```

```bash [pnpm]
pnpm add konsole-logger
```

:::

## Quick Start

### Basic Usage

```typescript
import { Konsole } from 'konsole-logger';

// Create a logger with a namespace
const logger = new Konsole({ namespace: 'MyApp' });

// Log messages (stored in memory by default)
logger.log('Application started');
logger.info('Loading configuration...');
logger.warn('Config file not found, using defaults');
logger.error('Failed to connect to database');
```

### Viewing Logs

By default, logs are only stored in memory. To view them:

```typescript
// View logs in batches
logger.viewLogs();

// Or get all logs programmatically
const logs = logger.getLogs();
console.log(logs);
```

### Printing to Console

To print logs to the console as they happen, set the `criteria` option:

```typescript
// Always print to console
const logger = new Konsole({
  namespace: 'Debug',
  criteria: true,
});

logger.log('This will print to console immediately');
```

## Next Steps

- Learn about [Namespaces](/guide/namespaces) for organizing logs
- Explore [Conditional Logging](/guide/conditional-logging) for advanced control
- Set up [Browser Debugging](/guide/browser-debugging) for production use


