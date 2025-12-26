# API Reference

This section provides detailed documentation for all Konsole exports.

## Exports

The `konsole-logger` package exports the following:

```typescript
import { 
  Konsole,          // Main class
  // Types
  LogEntry,         // Log entry type
  Criteria,         // Criteria type
  KonsolePublic,    // Public interface
  KonsoleOptions,   // Options interface
} from 'konsole-logger';

// Default export is also available
import Konsole from 'konsole-logger';
```

## Quick Reference

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `Konsole.getLogger(namespace?)` | `Konsole` | Get or create a logger |
| `Konsole.getNamespaces()` | `string[]` | List all namespaces |
| `Konsole.exposeToWindow()` | `void` | Expose to browser window |
| `Konsole.enableGlobalPrint(enabled)` | `void` | Toggle global output |

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `log(...args)` | `void` | Log a message |
| `error(...args)` | `void` | Log an error |
| `warn(...args)` | `void` | Log a warning |
| `info(...args)` | `void` | Log info |
| `viewLogs(batchSize?)` | `void` | View logs in console |
| `getLogs()` | `LogEntry[]` | Get all logs |
| `clearLogs()` | `void` | Clear all logs |
| `resetBatch()` | `void` | Reset view position |
| `setCriteria(criteria)` | `void` | Update criteria |
| `destroy()` | `void` | Clean up instance |

## Pages

- [Konsole Class](/api/konsole) — Full class documentation
- [Types](/api/types) — Type definitions


