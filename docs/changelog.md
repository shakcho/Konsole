# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-01

### Added

- Initial release
- Namespaced logging with `Konsole` class
- Log levels: `log`, `error`, `warn`, `info`
- In-memory log storage with automatic cleanup
- Conditional logging with boolean and function criteria
- `viewLogs()` for batch viewing of stored logs
- `getLogs()` for programmatic access to logs
- `clearLogs()` to remove all stored logs
- Static `getLogger()` to retrieve existing loggers
- Static `exposeToWindow()` for browser debugging
- Static `enableGlobalPrint()` for global output toggle
- Configurable retention period and cleanup interval
- Full TypeScript support with exported types
- Zero dependencies

### Security

- Window exposure is opt-in and can be conditionally enabled


