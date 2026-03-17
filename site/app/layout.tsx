import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Konsole — Structured logging for browser & Node.js',
  description:
    'Konsole is a structured, namespaced logging library for JavaScript and TypeScript. Numeric log levels, child loggers, beautiful terminal output, and flexible transports.',
  keywords: [
    'pino',
    'pino alternative',
    'structured logging',
    'javascript logger',
    'typescript logger',
    'child logger',
    'ndjson',
    'log levels',
    'browser logging',
    'node logger',
  ],
  authors: [{ name: 'Sakti Kumar Chourasia', url: 'https://saktichourasia.dev' }],
  openGraph: {
    title: 'Konsole — Structured logging for browser & Node.js',
    description:
      'Konsole is a structured, namespaced logging library for JavaScript and TypeScript. Numeric log levels, child loggers, beautiful terminal output, and flexible transports.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
