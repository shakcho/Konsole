# What is Konsole?

Konsole is a structured, namespaced logging library for JavaScript and TypeScript that works in both **browser** and **Node.js** environments. It delivers structured output quality with great developer experience — beautiful terminal formatting, browser DevTools styling, and a clean API.

- **Structured logging** with a consistent JSON schema
- **Namespaced logging** for organized, component-specific logs
- **Child loggers** that inherit config and attach request-scoped context
- **Beautiful terminal output** with ANSI colors and human-readable formatting
- **Multiple transports** — HTTP, file, stream, or console
- **Memory-efficient storage** with circular buffers
- **Web Worker support** for background processing in browsers
- **Node.js and browser** — works in both without any configuration

## Why Konsole?

Traditional `console.log` statements have several limitations:

1. **No organization** — Logs from different parts of your app mix together
2. **No levels** — No trace/debug/info/warn/error/fatal distinction
3. **No structure** — Can't easily parse logs or send them to aggregators
4. **No context** — No way to attach request IDs or user context automatically
5. **No history** — Once a log scrolls off screen, it's gone
6. **No backend** — You can't send logs to a server for analysis

Konsole solves all of these while remaining lightweight and dependency-free.

## Comparison

| Feature | console.log | Konsole |
|---------|-------------|---------|
| Namespacing | ❌ | ✅ |
| Child loggers | ❌ | ✅ |
| Numeric log levels | ❌ | ✅ |
| Structured JSON output | ❌ | ✅ |
| Pretty terminal output | ❌ | ✅ built-in |
| Configurable timestamps | ❌ | ✅ (ISO, epoch, custom, nanosecond) |
| Browser DevTools styling | ❌ | ✅ |
| Log storage / history | ❌ | ✅ |
| Multiple transports | ❌ | ✅ |
| File transport | ❌ | ✅ |
| Web Worker transport | ❌ | ✅ (non-blocking browser logging) |
| Type safety | ❌ | ✅ |
| Zero dependencies | ✅ | ✅ |
| Browser + Node.js | ✅ (basic) | ✅ (structured, with DevTools tooling) |
| Bundle (gzip) | 0 KB | ~10 KB (vs Pino ~32 KB, Winston ~70 KB) |

## Philosophy

- **Zero dependencies** — No bloat, no supply chain risk
- **TypeScript first** — Full type safety out of the box
- **DX over config** — Works beautifully out of the box; sensible defaults for every environment
- **Production-ready** — Structured output for log aggregators; debug tooling for production incidents

## Guides

- [Getting Started](/guide/getting-started) — Installation and basic usage
- [Configuration](/guide/configuration) — All available options
- [Namespaces & Child Loggers](/guide/namespaces) — Organizing logs and attaching context
- [Log Levels & Output](/guide/conditional-logging) — Controlling what gets logged
- [Timestamps](/guide/timestamps) — Format presets, custom functions, and nanosecond precision
- [Transports](/guide/transports) — Sending logs to files, streams, and backends
- [Browser Debugging](/guide/browser-debugging) — Production debugging tools
- [Viewing Logs](/guide/viewing-logs) — Batch viewing and filtering
- [Performance](/guide/performance) — Optimization tips
