# What is Konsole?

Konsole is a lightweight, namespaced logging library for JavaScript and TypeScript applications. It provides a simple way to manage logs across your application with features like:

- **Namespaced logging** for organized, component-specific logs
- **In-memory storage** for accessing historical logs
- **Conditional output** to control what gets printed to the console
- **Browser debugging tools** for production debugging

## Why Konsole?

Traditional `console.log` statements have several limitations:

1. **No organization** — Logs from different parts of your app mix together
2. **No history** — Once a log scrolls off screen, it's gone
3. **No control** — You can't easily toggle logging on/off for specific features
4. **No filtering** — Finding relevant logs in a sea of output is painful

Konsole solves all of these problems while remaining lightweight and dependency-free.

## Comparison

| Feature | console.log | Konsole |
|---------|-------------|---------|
| Namespacing | ❌ | ✅ |
| Log storage | ❌ | ✅ |
| Conditional output | ❌ | ✅ |
| Type safety | ❌ | ✅ |
| Zero runtime cost | ✅ | ✅ |
| Browser debugging | ❌ | ✅ |

## Philosophy

Konsole follows these principles:

- **Zero dependencies** — No bloat, no supply chain risk
- **TypeScript first** — Full type safety out of the box
- **Non-intrusive** — Logs are stored silently by default
- **Production-ready** — Designed for debugging production issues


