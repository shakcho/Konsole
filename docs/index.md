---
layout: home

hero:
  name: "Konsole"
  text: "Logging for Browser & Node.js"
  tagline: Structured, namespaced, TypeScript-first logging with beautiful terminal output and flexible transports
  image:
    src: /logo.svg
    alt: Konsole
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/shakcho/Konsole

features:
  - icon: 🌐
    title: Browser-First, Node.js Ready
    details: Works everywhere — styled badges in DevTools, pretty ANSI in the terminal, NDJSON in CI. Web Worker transport keeps the browser UI thread free. No other structured logger offers this.
  - icon: 🏷️
    title: Namespaced + Child Loggers
    details: Organize logs by feature with namespaces. Create child loggers that inherit config and automatically attach request IDs, user context, and more.
  - icon: 📊
    title: Structured Logging
    details: Structured JSON schema with numeric log levels. trace=10, debug=20, info=30, warn=40, error=50, fatal=60. Compatible with Datadog, Loki, and any log aggregator.
  - icon: ⏱️
    title: Configurable Timestamps
    details: Full date+time by default. ISO 8601, epoch seconds/ms, time-only, or custom functions. High-resolution nanosecond precision. Change format at runtime in the browser.
  - icon: 🚀
    title: Flexible Transports
    details: Ship logs to any destination — HTTP endpoints, log files, writable streams, or the console. Batching, retry, and filtering built in.
  - icon: 💾
    title: Memory-Efficient Storage
    details: Circular buffer stores logs for browser DevTools inspection. In Node.js, buffer is off by default for maximum throughput. Web Worker offloads transport processing from the main thread.
  - icon: 📦
    title: TypeScript First
    details: Built with TypeScript from the ground up. Full type safety, zero runtime dependencies.
  - icon: ⚡
    title: Fast & Lightweight
    details: "~10 KB gzipped, zero dependencies. On par with Pino on overhead, faster on JSON serialization, and significantly faster than Winston and Bunyan."
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --vp-home-hero-image-filter: blur(44px);
}

.dark {
  --vp-home-hero-image-background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
