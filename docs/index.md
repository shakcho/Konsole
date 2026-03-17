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
    title: Browser & Node.js
    details: Works everywhere — pretty ANSI colors in the terminal, styled badges in DevTools, newline-delimited JSON in CI pipelines.
  - icon: 🏷️
    title: Namespaced + Child Loggers
    details: Organize logs by feature with namespaces. Create child loggers that inherit config and automatically attach request IDs, user context, and more.
  - icon: 📊
    title: Structured Logging
    details: Structured JSON schema with numeric log levels. trace=10, debug=20, info=30, warn=40, error=50, fatal=60. Compatible with Datadog, Loki, and any log aggregator.
  - icon: 🚀
    title: Flexible Transports
    details: Ship logs to any destination — HTTP endpoints, log files, writable streams, or the console. Batching, retry, and filtering built in.
  - icon: 💾
    title: Memory-Efficient Storage
    details: Circular buffer with configurable limits. Automatically evicts oldest logs to prevent memory bloat.
  - icon: 📦
    title: TypeScript First
    details: Built with TypeScript from the ground up. Full type safety, zero runtime dependencies.
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
