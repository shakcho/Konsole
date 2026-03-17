# Konsole — Improvement Roadmap

Goal: universal logging library (Browser + Node.js) competitive with Pino.js, with better DX.

---

## P0 — Blocking / Core Parity

- [x] **Node.js compatibility**
  - [x] Replace `window` usage with `globalThis`
  - [x] Guard `fetch` with environment detection; require Node 18+ or accept `fetchImpl` option
  - [x] Add clear warning when `useWorker: true` is set in Node.js (graceful fallback)
  - [x] Add `@types/node` to devDependencies
  - [x] Add `engines: { node: ">=18.0.0" }` to `package.json`
  - [ ] Replace browser `Worker` + Blob approach with platform adapter (browser Web Worker / Node.js `worker_threads`) — deferred to P3
  - [ ] Add conditional `node` / `browser` exports in `package.json` — deferred until transports diverge

- [x] **JSON structured output + numeric log levels**
  - [x] Add `trace()`, `debug()`, `fatal()` methods
  - [x] Assign numeric values: `trace=10, debug=20, info=30, warn=40, error=50, fatal=60`
  - [x] Add `level` option (minimum level threshold, replaces `criteria` for common case)
  - [x] Add `format: 'auto' | 'pretty' | 'json' | 'text' | 'browser' | 'silent'` option
  - [x] Use `process.stdout.write()` in Node.js (errors/fatal → stderr)
  - [x] Standardize log line schema: `{ level, levelName, time, namespace, msg, ...fields }`
  - [x] Built-in pretty formatter with ANSI colors (auto-enabled on TTY, respects NO_COLOR)
  - [x] Built-in browser formatter with CSS badge styling via `%c`
  - [x] Pino-style object-first calling convention: `logger.info({ msg: '...', key: val })`
  - [x] Structured field extraction: `logger.info('msg', { key: val })` → fields spread into output

---

## P1 — High Impact

- [x] **Child loggers with bindings**
  - [x] `logger.child({ requestId, userId })` returns a new logger inheriting parent config
  - [x] Bindings merged into every log entry automatically (call-site fields override bindings)
  - [x] Child inherits level, transports, format, buffer from parent
  - [x] Nested children accumulate bindings from all ancestor layers
  - [x] Optional `{ namespace, level }` overrides per child
  - [x] Children are ephemeral — not registered in `Konsole.instances`
  - [x] `child.addTransport()` does not affect parent (separate array, shared instances)

- [x] **Transport abstraction**
  - [x] Define `Transport` interface in `types.ts` (`write`, `flush?`, `destroy`)
  - [x] Rename `Transport` → `HttpTransport` (old `src/Transport.ts` is now a deprecated re-export)
  - [x] Add `ConsoleTransport` — wraps any `KonsoleFormat` formatter; useful with `format: 'silent'`
  - [x] Add `FileTransport` — appends to disk via `fs.createWriteStream`; buffers entries during async open
  - [x] Add `StreamTransport` — writes to any `WritableLike` (duck-typed, no `@types/node` required)
  - [x] `addTransport()` and `KonsoleOptions.transports` accept both `Transport` instances and `TransportConfig` objects
  - [x] `node:fs` and all `node:` builtins marked external in Rollup (no browser stubs)
  - [ ] File rotation — deferred to later

- [x] **Test suite (Vitest)**
  - [x] Add `vitest` to devDependencies
  - [x] Add `"test": "vitest"`, `"test:run": "vitest run"`, `"test:coverage": "vitest run --coverage"` scripts
  - [x] Unit tests: `CircularBuffer` (capacity, eviction, retain, edge cases)
  - [x] Unit tests: `HttpTransport` (batching, flush, retry, backoff, filter, transform)
  - [x] Unit tests: log level filtering
  - [x] Unit tests: child logger binding inheritance
  - [x] Unit tests: `ConsoleTransport`, `StreamTransport`, `FileTransport`
  - [x] Unit tests: all formatters (Pretty, JSON, Text, Silent)
  - [ ] Integration tests: Browser environment (happy-dom) — deferred

---

## P2 — DX Wins

- [ ] **Built-in pretty formatter**
  - [ ] Colorized level labels
  - [ ] Human-readable timestamp
  - [ ] Indented extra fields
  - [ ] Auto-enable in TTY / dev environments

- [ ] **Redaction**
  - [ ] `redact: string[]` option accepting dot-path field names
  - [ ] Replace matched values with `[REDACTED]` before any output or transport

- [ ] **Serializers**
  - [ ] `serializers` option: `{ err: ..., req: ..., res: ... }`
  - [ ] Ship built-in `stdSerializers` for `Error`, HTTP `req`/`res`

- [ ] **Graceful shutdown**
  - [ ] `process.on('exit')`  / `SIGTERM` handler to flush pending transports
  - [ ] `logger.flush()` returns a promise that resolves when all transports are drained

---

## P3 — Advanced

- [ ] **AsyncLocalStorage context propagation** (Node.js)
  - [ ] `Konsole.runWithContext(store, fn)` to bind context to async scope
  - [ ] Auto-merge context store into every log entry within the scope

- [ ] **API ergonomics cleanup**
  - [ ] Rename `criteria` → keep as advanced `filter` option, `level` handles common case
  - [ ] `viewLogs()` moved to a dev-only utility / debug helper, not core API
  - [ ] Expand `KonsolePublic` interface to expose all logging methods

- [ ] **Replace inline worker string**
  - [ ] Move worker logic to `src/worker.ts` as a proper TypeScript module
  - [ ] Bundle with Vite `?worker` import or separate entry point
  - [ ] Remove `getWorkerCode()` string template from `Konsole.ts`

- [ ] **Auto metadata in Node.js**
  - [ ] Include `pid` and `hostname` in log entries automatically (opt-out via option)

---

## Done

_(moved here as items are completed)_
