import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Konsole',
  description: 'A lightweight, namespaced logging library for JavaScript/TypeScript',
  
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      {
        text: 'v1.0.0',
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
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Namespaces', link: '/guide/namespaces' },
            { text: 'Conditional Logging', link: '/guide/conditional-logging' },
            { text: 'Viewing Logs', link: '/guide/viewing-logs' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Browser Debugging', link: '/guide/browser-debugging' },
            { text: 'Configuration', link: '/guide/configuration' },
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
      { icon: 'github', link: 'https://github.com/your-username/konsole' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024',
    },

    search: {
      provider: 'local',
    },
  },
});


