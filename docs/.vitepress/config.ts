import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Konsole',
  description: 'Structured, namespaced logging for browser and Node.js',
  base: '/docs/',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'description', content: 'Konsole is a structured, namespaced logging library for JavaScript and TypeScript. Works in browser and Node.js. Numeric log levels, child loggers, beautiful terminal output, and flexible transports.' }],
    ['meta', { name: 'keywords', content: 'javascript logger, typescript logger, structured logging, namespaced logging, browser logging, node logger, child logger, pino, pino alternative, ndjson, log levels' }],
    ['meta', { property: 'og:description', content: 'Structured, namespaced logging for browser and Node.js. Numeric log levels, child loggers, beautiful terminal output, and flexible transports.' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Live Demo', link: 'https://your-site-url.com' },
      {
        text: 'v3.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Konsole?', link: '/guide/' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Namespaces & Child Loggers', link: '/guide/namespaces' },
            { text: 'Log Levels & Output', link: '/guide/conditional-logging' },
            { text: 'Transports', link: '/guide/transports' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Viewing Logs', link: '/guide/viewing-logs' },
            { text: 'Browser Debugging', link: '/guide/browser-debugging' },
            { text: 'Performance', link: '/guide/performance' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Konsole Class', link: '/api/konsole' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/shakcho/Konsole' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024–2025 Sakti Kumar Chourasia',
    },

    search: {
      provider: 'local',
    },
  },
});
