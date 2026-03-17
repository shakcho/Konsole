# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-03-14

### Added

- **Node.js compatibility** — Works in both browser and Node.js ≥ 18
  - Replaced `window` usage with `globalThis` throughout
  - `fetch` is detected via `globalThis.fetch`; pass `fetchImpl` for Node.js < 18
  - Graceful warning when `useWorker: true` is set in Node.js

- **Numeric log levels** — Six-level numeric system
  - New methods: `trace()` (10), `debug()` (20), `fatal()` (60)
  - `log()` kept as an alias for `info()` (30)
  - New `level` constructor option — minimum threshold; entries below are discarded entirely
  - New `setLevel()` instance method for runtime changes
  - `LogEntry` now includes `level` and `levelValue` fields

- **Structured logging** — Consistent JSON schema
  - Log entries now carry `msg` and `fields` (structured key-value pairs) in addition to `messages`
  - Fields spread into the top level of JSON output: `{ level, levelName, time, namespace, msg, ...fields }`
  - Object-first calling convention: `logger.info({ msg: '...', key: val })`
  - String + fields object: `logger.info('msg', { key: val })`
  - `Error` as first argument: `msg` = `err.message`, `fields.err` = the Error

- **Output formatters** — `format` constructor option (`'auto' | 'pretty' | 'json' | 'text' | 'browser' | 'silent'`)
  - `PrettyFormatter` — ANSI-colored human-readable output for TTY terminals; respects `NO_COLOR` / `FORCE_COLOR`
  - `JsonFormatter` — Newline-delimited JSON for pipes, CI, and log aggregators
  - `TextFormatter` — Plain text, no ANSI, for CI environments
  - `BrowserFormatter` — `%c` CSS badge styling in browser DevTools
  - `SilentFormatter` — No output; entries still stored in buffer and forwarded to transports
  - `auto` selects the best formatter for the current environment automatically
  - Errors and fatals always route to `stderr`; all other levels to `stdout`

- **Child loggers** — `logger.child(bindings, options?)`
  - Bindings automatically merged into every entry the child produces
  - Bindings accumulate through nested children; call-site fields override on collision
  - Optional `{ namespace, level }` overrides per child
  - Children share parent's circular buffer and formatter
  - Children are not registered in `Konsole.instances` (ephemeral)
  - `child.addTransport()` does not affect parent

- **Transport abstraction** — New `Transport` interface with `write`, `flush?`, `destroy`
  - `HttpTransport` — renamed from `Transport`; updated payload to structured JSON schema
  - `ConsoleTransport` — wraps a Formatter; useful with `format: 'silent'`
  - `FileTransport` — appends NDJSON/text to a file; Node.js only; buffers entries during async open
  - `StreamTransport` — writes to any `WritableLike`; duck-typed for compatibility
  - `addTransport()` and `transports` option now accept both `Transport` instances and `TransportConfig` objects

- **Vitest test suite** — 92 tests across 8 files covering all core components and transports

### Changed

- `criteria` is now **deprecated** — use `level` for threshold filtering and `format: 'silent'` to suppress output
- `TransportConfig` no longer the only type accepted by `transports`/`addTransport()` — both `Transport` instances and `TransportConfig` plain objects are accepted
- `LogEntry.logtype` is deprecated — use `LogEntry.level`
- Rollup now externalizes all `node:` built-ins to prevent browser stubs

### Breaking Changes

- `LogEntry` shape changed: added `msg`, `fields`, `level`, `levelValue`; `logtype` is now `@deprecated`
- Old `Transport` class is now `HttpTransport`; `src/Transport.ts` is a deprecated re-export
- `criteria: false` (the old default) is superseded by `format: 'silent'`

---

## [2.0.0] - 2024-12-27

### Added

- **Circular Buffer Storage** — Memory-efficient log storage with configurable `maxLogs` limit
  - Automatically evicts oldest logs when capacity is reached
  - New `CircularBuffer` class exported for custom use

- **Web Worker Support** — Offload log processing to background thread
  - Enable with `useWorker: true` option
  - New `getLogsAsync()` method for async log retrieval

- **Transport System** — Send logs to external services
  - Configurable `batchSize`, `flushInterval`, retry with exponential backoff
  - Filter and transform per entry
  - New `addTransport()` and `flushTransports()` methods

- **Memory Statistics** — `getStats()` returns log count and buffer usage

- **Global Transport** — `Konsole.addGlobalTransport()` static method

### Changed

- `destroy()` method is now async and returns a Promise
- Log storage uses `CircularBuffer` instead of a plain array

### Fixed

- `viewLogs()` no longer shows "Array(1)" — messages are correctly formatted

---

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Namespaced logging with `Konsole` class
- Log levels: `log`, `error`, `warn`, `info`
- In-memory log storage with automatic cleanup
- Conditional logging with boolean and function criteria
- `viewLogs()` for batch viewing of stored logs
- `getLogs()` for programmatic access
- `clearLogs()` to remove all stored logs
- `Konsole.getLogger()`, `exposeToWindow()`, `enableGlobalPrint()`
- Configurable retention period and cleanup interval
- Full TypeScript support with exported types
- Zero dependencies

### Security

- Window exposure is opt-in and can be conditionally enabled
