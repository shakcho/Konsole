# Contributing

Thank you for your interest in contributing to Konsole! This document provides guidelines for contributing.

## Development Setup

1. **Clone the repository**

```bash
git clone https://github.com/your-username/konsole.git
cd konsole
```

2. **Install dependencies**

```bash
npm install
```

3. **Start development**

```bash
# Run the library in dev mode
npm run dev

# Run the docs site
npm run docs:dev
```

## Project Structure

```
konsole/
├── src/
│   ├── index.ts      # Entry point with exports
│   └── Konsole.ts    # Main implementation
├── docs/             # VitePress documentation
├── dist/             # Build output (generated)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Building

```bash
# Build the library
npm run build

# Build the docs
npm run docs:build
```

## Pull Request Process

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run `npm run build` to ensure the build passes
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. Open a **Pull Request**

## Code Style

- Use TypeScript for all source code
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep the library dependency-free

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new method for X`
- `fix: resolve issue with Y`
- `docs: update getting started guide`
- `refactor: improve Z implementation`

## Reporting Issues

When reporting issues, please include:

1. Konsole version
2. Browser/Node.js version
3. Steps to reproduce
4. Expected vs actual behavior
5. Code samples if applicable

## Feature Requests

Feature requests are welcome! Please describe:

1. The problem you're trying to solve
2. Your proposed solution
3. Any alternatives you've considered

## License

By contributing, you agree that your contributions will be licensed under the MIT License.


