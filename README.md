# Konsole

<div align="center">

**A lightweight, namespaced logging library for JavaScript/TypeScript**

[![npm version](https://img.shields.io/npm/v/konsole-logger.svg)](https://www.npmjs.com/package/konsole-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## ✨ Features

- 🏷️ **Namespaced Logging** — Organize logs by component, module, or feature
- 💾 **In-Memory Storage** — Access historical logs for debugging
- ⚡ **Conditional Output** — Control when logs appear in console
- 🔧 **Zero Dependencies** — Lightweight and fast
- 📦 **TypeScript First** — Full type safety out of the box
- 🌐 **Browser & Node** — Works everywhere JavaScript runs

## 📦 Installation

```bash
npm install konsole-logger
```

```bash
yarn add konsole-logger
```

```bash
pnpm add konsole-logger
```

## 🚀 Quick Start

```typescript
import { Konsole } from "konsole-logger";

// Create a logger with a namespace
const logger = new Konsole({ namespace: "MyApp" });

// Log messages (stored in memory by default)
logger.log("Application started");
logger.info("Loading configuration...");
logger.warn("Config file not found, using defaults");
logger.error("Failed to connect to database");

// View stored logs
logger.viewLogs();
```

## 📖 Usage

### Basic Logging

```typescript
import { Konsole } from "konsole-logger";

const logger = new Konsole({ namespace: "Auth" });

logger.log("User login attempt");
logger.info("Session created");
logger.warn("Token expiring soon");
logger.error("Authentication failed");
```

### Conditional Logging

Control when logs appear in the console:

```typescript
// Always print to console
const devLogger = new Konsole({
  namespace: "Debug",
  criteria: true,
});

// Never print to console (only store)
const silentLogger = new Konsole({
  namespace: "Silent",
  criteria: false,
});

// Custom criteria function
const errorLogger = new Konsole({
  namespace: "Errors",
  criteria: (entry) => entry.logtype === "error",
});
```

### Multiple Namespaces

```typescript
const authLogger = new Konsole({ namespace: "Auth" });
const apiLogger = new Konsole({ namespace: "API" });
const uiLogger = new Konsole({ namespace: "UI" });

// Retrieve loggers later
const auth = Konsole.getLogger("Auth");
auth.log("Retrieved existing logger");

// List all namespaces
console.log(Konsole.getNamespaces()); // ['Auth', 'API', 'UI']
```

### Viewing Logs

```typescript
const logger = new Konsole({ namespace: "App" });

// Log some messages
logger.log("Message 1");
logger.log("Message 2");
logger.log("Message 3");

// View logs in batches (default: 100)
logger.viewLogs();

// Custom batch size
logger.viewLogs(50);

// Get all logs programmatically
const allLogs = logger.getLogs();
console.log(allLogs);

// Clear logs
logger.clearLogs();
```

### Browser Debugging

Expose Konsole to the window for debugging in production:

```typescript
import { Konsole } from "konsole-logger";

// In your app initialization
Konsole.exposeToWindow();

// Then in browser console:
// __Konsole.getLogger('Auth').viewLogs()
// __Konsole.listLoggers()
// __Konsole.enableAll()  // Enable console output for all loggers
// __Konsole.disableAll() // Disable console output
```

### Configuration Options

```typescript
interface KonsoleOptions {
  namespace?: string; // Logger namespace (default: 'Global')
  criteria?: Criteria; // Logging criteria (default: false)
  defaultBatchSize?: number; // Batch size for viewLogs (default: 100)
  retentionPeriod?: number; // Log retention in ms (default: 48 hours)
  cleanupInterval?: number; // Cleanup interval in ms (default: 1 hour)
}
```

## 🔧 API Reference

### Static Methods

| Method                               | Description                            |
| ------------------------------------ | -------------------------------------- |
| `Konsole.getLogger(namespace)`       | Get an existing logger by namespace    |
| `Konsole.getNamespaces()`            | Get all registered namespace names     |
| `Konsole.exposeToWindow()`           | Expose Konsole to window for debugging |
| `Konsole.enableGlobalPrint(enabled)` | Enable/disable global console output   |

### Instance Methods

| Method                  | Description                   |
| ----------------------- | ----------------------------- |
| `log(...args)`          | Log a message                 |
| `error(...args)`        | Log an error                  |
| `warn(...args)`         | Log a warning                 |
| `info(...args)`         | Log info                      |
| `viewLogs(batchSize?)`  | View stored logs in console   |
| `getLogs()`             | Get all logs as an array      |
| `clearLogs()`           | Clear all stored logs         |
| `resetBatch()`          | Reset viewLogs batch position |
| `setCriteria(criteria)` | Update logging criteria       |
| `destroy()`             | Clean up and remove logger    |

## 📁 Examples

Check out the [`examples/`](./examples) directory for working implementations:

- **[Vanilla JS](./examples/vanilla-js)** — Simple HTML page with no build tools
- **[React](./examples/react)** — React + TypeScript integration

### Running Examples

```bash
# Vanilla JS - just open in browser after building
npm run build
open examples/vanilla-js/index.html

# React
cd examples/react
npm install
npm run dev
```

## 📄 License

MIT © [Your Name]

---

<div align="center">

📚 [Documentation](https://your-docs-url.com) · 🐛 [Report Bug](https://github.com/your-repo/issues) · ✨ [Request Feature](https://github.com/your-repo/issues)

</div>
