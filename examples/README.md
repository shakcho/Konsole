# Konsole Examples

This directory contains example implementations of Konsole in different environments.

## Vanilla JavaScript

A simple HTML page demonstrating Konsole with Vite for development and production builds.

### Running

1. Navigate to the vanilla-js example:

```bash
cd examples/vanilla-js
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Or from the root directory:

```bash
npm run example:vanilla:install  # First time only
npm run example:vanilla
```

### Features Demonstrated

- Creating multiple namespaced loggers
- Logging with different levels (log, info, warn, error)
- Viewing logs in the browser console
- Toggling global print
- Using `__Konsole` in the browser console

---

## React

A React + TypeScript application showing Konsole integration with modern frontend frameworks.

### Running

1. Navigate to the React example:

```bash
cd examples/react
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

Or from the root directory:

```bash
npm run example:react:install  # First time only
npm run example:react
```

### Features Demonstrated

- Creating loggers at module level
- Integrating with React state
- Using `Konsole.getLogger()` to retrieve loggers
- Exposing to window for debugging
- Building a custom log display UI

---

## Tips for Your Project

### Custom Hook (React)

```tsx
import { useMemo } from "react";
import { Konsole } from "konsole-logger";

export function useLogger(namespace: string) {
  return useMemo(() => {
    return Konsole.getLogger(namespace);
  }, [namespace]);
}

// Usage
function MyComponent() {
  const logger = useLogger("MyComponent");

  useEffect(() => {
    logger.info("Component mounted");
    return () => logger.info("Component unmounted");
  }, [logger]);
}
```

### Singleton Pattern

```typescript
// lib/logger.ts
import { Konsole } from "konsole-logger";

// Create all loggers upfront
export const appLogger = new Konsole({ namespace: "App" });
export const apiLogger = new Konsole({ namespace: "API" });
export const authLogger = new Konsole({ namespace: "Auth" });

// Expose in development
if (import.meta.env.DEV) {
  Konsole.exposeToWindow();
}
```
