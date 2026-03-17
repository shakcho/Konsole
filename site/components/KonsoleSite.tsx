'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Konsole } from 'konsole-logger';
import type { LogEntry } from 'konsole-logger';

// ─── Site links ───────────────────────────────────────────────────────────────

const LINKS = {
  docs:      '/docs',
  github:    'https://github.com/shakcho/Konsole',
  authorGh:  'https://github.com/shakcho',
  portfolio: 'https://saktichourasia.dev',
};

// ─── Syntax highlighting ─────────────────────────────────────────────────────

const SYN = {
  keyword:  '#c586c0',
  string:   '#ce9178',
  comment:  '#6a9955',
  number:   '#b5cea8',
  boolean:  '#569cd6',
  func:     '#dcdcaa',
  tag:      '#569cd6',
  attr:     '#9cdcfe',
  plain:    '#d4d4d4',
};

function highlightCode(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, li) => {
    const tokens: React.ReactNode[] = [];
    let rest = line;
    let key = 0;
    const push = (text: string, color: string) => {
      tokens.push(<span key={key++} style={{ color }}>{text}</span>);
    };

    // Process line character by character via regex chunks
    while (rest.length > 0) {
      // Comment
      let m = rest.match(/^(\/\/.*)/);
      if (m) { push(m[1], SYN.comment); rest = rest.slice(m[1].length); continue; }

      // HTML tag-like: <script ...> </script>
      m = rest.match(/^(<\/?[a-zA-Z][a-zA-Z0-9-]*)/);
      if (m) { push(m[1], SYN.tag); rest = rest.slice(m[1].length); continue; }
      m = rest.match(/^(>)/);
      if (m && tokens.length > 0) { push('>', SYN.tag); rest = rest.slice(1); continue; }

      // String (single, double, backtick — no multiline)
      m = rest.match(/^('[^']*'|"[^"]*"|`[^`]*`)/);
      if (m) { push(m[1], SYN.string); rest = rest.slice(m[1].length); continue; }

      // Number
      m = rest.match(/^(\b\d+\.?\d*\b)/);
      if (m) { push(m[1], SYN.number); rest = rest.slice(m[1].length); continue; }

      // Boolean / special
      m = rest.match(/^(\b(?:true|false|null|undefined)\b)/);
      if (m) { push(m[1], SYN.boolean); rest = rest.slice(m[1].length); continue; }

      // Keywords
      m = rest.match(/^(\b(?:import|from|export|const|let|var|function|return|if|else|new|await|async|for|of|in|class|extends|type|interface|process|window|document|app)\b)/);
      if (m) { push(m[1], SYN.keyword); rest = rest.slice(m[1].length); continue; }

      // Arrow / symbols
      m = rest.match(/^(=>)/);
      if (m) { push('=>', SYN.keyword); rest = rest.slice(2); continue; }

      // Function call: word followed by (
      m = rest.match(/^([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)(\s*\()/);
      if (m) {
        const parts = m[1].split('.');
        parts.forEach((part, i) => {
          if (i > 0) push('.', SYN.plain);
          if (i === parts.length - 1) push(part, SYN.func);
          else push(part, SYN.plain);
        });
        push(m[2], SYN.plain);
        rest = rest.slice(m[0].length);
        continue;
      }

      // Attribute-like: word followed by = or :
      m = rest.match(/^([a-zA-Z_$][\w$]*)(\s*[:=])/);
      if (m) { push(m[1], SYN.attr); push(m[2], SYN.plain); rest = rest.slice(m[0].length); continue; }

      // Default: next char
      push(rest[0], SYN.plain);
      rest = rest.slice(1);
    }

    return <span key={li}>{tokens}{li < lines.length - 1 ? '\n' : null}</span>;
  });
}

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle' }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

// ─── Logger setup ─────────────────────────────────────────────────────────────

const appLogger  = new Konsole({ namespace: 'App',  format: 'silent', level: 'trace', maxLogs: 1000 });
const authLogger = new Konsole({ namespace: 'Auth', format: 'silent', level: 'trace', maxLogs: 1000 });
const apiLogger  = new Konsole({ namespace: 'API',  format: 'silent', level: 'trace', maxLogs: 1000 });

Konsole.exposeToWindow();

// ─── Types ────────────────────────────────────────────────────────────────────

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface DisplayLog {
  id: number;
  level: Level;
  namespace: string;
  msg: string;
  fields: Record<string, unknown>;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAMESPACES = ['App', 'Auth', 'API'] as const;
const LEVELS: Level[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

const loggerMap: Record<string, Konsole> = { App: appLogger, Auth: authLogger, API: apiLogger };

const LEVEL_MESSAGES: Record<Level, string[]> = {
  trace: ['→ enterFunction', '← exitFunction', 'loop i=0', 'loop i=1', 'allocated 4kb'],
  debug: ['Config loaded', 'Cache miss — fetching', 'Query plan generated', 'Token refreshed', 'Feature flag: on'],
  info:  ['Server started', 'User logged in', 'Order placed', 'Payment processed', 'Session initialized'],
  warn:  ['Slow response >500ms', 'Rate limit at 80%', 'Deprecated API used', 'Retrying request', 'Memory at 75%'],
  error: ['Database unreachable', 'Auth failed', 'Network timeout', 'Invalid payload', 'Permission denied'],
  fatal: ['Out of memory', 'Disk full', 'Unrecoverable crash', 'Segmentation fault', 'Stack overflow'],
};

const LEVEL_STYLE: Record<Level, React.CSSProperties> = {
  trace: { color: '#a3a3a3', background: '#f5f5f5' },
  debug: { color: '#0891b2', background: '#ecfeff' },
  info:  { color: '#16a34a', background: '#f0fdf4' },
  warn:  { color: '#d97706', background: '#fffbeb' },
  error: { color: '#dc2626', background: '#fef2f2' },
  fatal: { color: '#9333ea', background: '#fdf4ff' },
};

const LEVEL_BTN_BORDER: Record<Level, string> = {
  trace: '#d4d4d4',
  debug: '#67e8f9',
  info:  '#4ade80',
  warn:  '#fbbf24',
  error: '#f87171',
  fatal: '#d8b4fe',
};

// ─── Code snippets ────────────────────────────────────────────────────────────

const CODE_SNIPPETS = [
  {
    title: 'Six log levels',
    description: 'Six numeric log levels — discard everything below your threshold.',
    code: `const logger = new Konsole({
  namespace: 'App',
  level: 'info',    // trace + debug discarded
});

logger.trace('→ entering loop');   // 10 — dropped
logger.debug('Cache miss');         // 20 — dropped
logger.info('Server started', { port: 3000 }); // 30 ✅
logger.warn('Memory at 80%');       // 40 ✅
logger.error(new Error('timeout')); // 50 ✅
logger.fatal('Out of memory');      // 60 ✅`,
  },
  {
    title: 'Child loggers',
    description: 'Attach request context once — every log line carries it automatically.',
    code: `const logger = new Konsole({ namespace: 'API' });

// Per-request child — bindings on every line
const req = logger.child({
  requestId: 'req_abc',
  userId: 42,
});

req.info('Request started', { path: '/users' });
// → INF [API] Request started requestId=req_abc userId=42 path=/users

// Nest for subsystem context
const db = req.child({ component: 'postgres' });
db.debug('Query', { sql: 'SELECT...', ms: 4 });
// → DBG [API] Query requestId=req_abc userId=42 component=postgres`,
  },
  {
    title: 'Output formats',
    description: 'auto picks the best format for the environment — or force one explicitly.',
    code: `// Terminal (TTY) → ANSI-colored pretty output
// CI / pipes    → newline-delimited JSON
// Browser       → styled badges via %c
new Konsole({ namespace: 'App', format: 'auto' });

// Force formats
new Konsole({ format: 'pretty'  }); // always ANSI colored
new Konsole({ format: 'json'    }); // always NDJSON
new Konsole({ format: 'silent'  }); // no output — logs stored in memory
new Konsole({ format: 'browser' }); // DevTools badge styling`,
  },
  {
    title: 'Transports',
    description: 'Ship logs to files, streams, or HTTP endpoints with batching and retry.',
    code: `import { Konsole, FileTransport } from 'konsole-logger';

const logger = new Konsole({
  namespace: 'App',
  format: 'pretty',         // pretty in terminal
  transports: [
    new FileTransport({     // JSON to disk
      path: '/var/log/app.log',
    }),
    {                       // HTTP — batched POST
      name: 'datadog',
      url: 'https://http-intake.logs.datadoghq.com/v1/input',
      headers: { 'DD-API-KEY': process.env.DD_API_KEY },
      filter: (e) => e.levelValue >= 40, // warn+ only
    },
  ],
});`,
  },
];

// ─── Usage snippets ───────────────────────────────────────────────────────────

const USAGE_SNIPPETS = [
  {
    title: 'Browser (React JS)',
    description: 'Import as a module in any React app — works with Next.js, Vite, and CRA.',
    code: `import { Konsole } from 'konsole-logger';

// Create loggers at module level
const logger = new Konsole({ namespace: 'App', format: 'silent' });
const api    = new Konsole({ namespace: 'API', level: 'warn' });

function Dashboard() {
  const handleClick = () => {
    const req = logger.child({ requestId: crypto.randomUUID() });
    req.info('Dashboard loaded', { userId: 42 });
  };

  return <button onClick={handleClick}>Load</button>;
}

// Expose for DevTools debugging
Konsole.exposeToWindow();`,
  },
  {
    title: 'Browser (Vanilla JS)',
    description: 'Drop into any HTML page — no bundler, no build step.',
    code: `<script type="module">
  import { Konsole } from 'https://esm.sh/konsole-logger';

  const logger = new Konsole({ namespace: 'App' });

  logger.info('Page loaded', { href: location.href });
  logger.warn('Config missing, using defaults');
  logger.error(new Error('Network request failed'));

  // Inspect stored logs at any time
  logger.getLogs(); // → LogEntry[]

  // Expose for DevTools debugging
  Konsole.exposeToWindow();
  // → window.__Konsole.getLogger('App').viewLogs()
</script>`,
  },
  {
    title: 'Node.js',
    description: 'Works in Node.js ≥ 18 with no extra config — auto-selects pretty or NDJSON.',
    code: `import { Konsole, FileTransport } from 'konsole-logger';

const logger = new Konsole({ namespace: 'Server' });
// TTY  → colorized pretty output
// pipe → newline-delimited JSON

logger.info('Server started', { port: 3000 });

// Per-request child logger
app.use((req, res, next) => {
  req.log = logger.child({
    requestId: crypto.randomUUID(),
    method: req.method,
    path: req.path,
  });
  next();
});

// Flush to disk on shutdown
const file = new FileTransport({ path: './logs/app.log' });
logger.addTransport(file);

process.on('SIGTERM', async () => {
  await logger.flushTransports();
  process.exit(0);
});`,
  },
];

// ─── KonsoleSite ──────────────────────────────────────────────────────────────

export default function KonsoleSite() {
  const [activeNs, setActiveNs]             = useState<string>('App');
  const [globalPrint, setGlobalPrint]       = useState(false);
  const [useChild, setUseChild]             = useState(false);
  const [displayLogs, setDisplayLogs]       = useState<DisplayLog[]>([]);
  const [logIdCounter, setLogIdCounter]     = useState(0);
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [typeFilter, setTypeFilter]         = useState<'all' | Level>('all');
  const [nsFilter, setNsFilter]             = useState<'all' | string>('all');
  const [activeSnippet, setActiveSnippet]   = useState(0);
  const [activeUsage, setActiveUsage]       = useState(0);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Child logger for the active namespace (requestId changes per session)
  const childRef = useRef<Record<string, Konsole>>({});
  const childBindingsRef = useRef<Record<string, Record<string, unknown>>>({});
  useEffect(() => {
    for (const ns of NAMESPACES) {
      const bindings = { requestId: `req_${Math.random().toString(36).slice(2, 8)}`, userId: Math.floor(Math.random() * 9000 + 1000) };
      childRef.current[ns] = loggerMap[ns].child(bindings, { namespace: `${ns}:child` });
      childBindingsRef.current[ns] = bindings;
    }
  }, []);

  const pushLog = useCallback((level: Level, namespace: string, msg: string, fields: Record<string, unknown> = {}) => {
    setLogIdCounter((prev) => {
      const id = prev + 1;
      setDisplayLogs((logs) => [
        ...logs.slice(-99),
        { id, level, namespace, msg, fields, timestamp: new Date() },
      ]);
      return id;
    });
  }, []);

  const handleLog = (level: Level) => {
    const msgs = LEVEL_MESSAGES[level];
    const msg  = msgs[Math.floor(Math.random() * msgs.length)];
    const fields: Record<string, unknown> = { ms: Math.floor(Math.random() * 400 + 1) };

    const logger = useChild ? childRef.current[activeNs] : loggerMap[activeNs];

    logger[level](msg, fields);

    pushLog(level, useChild ? `${activeNs}:child` : activeNs, msg, useChild
      ? { ...childBindingsRef.current[activeNs], ...fields }
      : fields,
    );
  };

  const toggleGlobalPrint = () => {
    const next = !globalPrint;
    setGlobalPrint(next);
    Konsole.enableGlobalPrint(next);
    pushLog('info', 'sys', `Global print ${next ? 'enabled' : 'disabled'}`);
  };

  const clearAll = () => {
    for (const ns of NAMESPACES) loggerMap[ns].clearLogs();
    setDisplayLogs([]);
    setLogIdCounter(0);
  };

  const getAllLogs = (): LogEntry[] => {
    const all: LogEntry[] = [];
    for (const ns of NAMESPACES) all.push(...(loggerMap[ns].getLogs() as LogEntry[]));
    return all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  const getFilteredLogs = () => {
    let logs = getAllLogs();
    if (nsFilter !== 'all')   logs = logs.filter((l) => l.namespace === nsFilter);
    if (typeFilter !== 'all') logs = logs.filter((l) => l.level === typeFilter);
    return logs;
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatFields = (fields: Record<string, unknown>) => {
    const entries = Object.entries(fields);
    if (!entries.length) return '';
    return entries.map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`).join('  ');
  };

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [displayLogs]);

  // Esc closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const highlightedSnippet = useMemo(() => highlightCode(CODE_SNIPPETS[activeSnippet].code), [activeSnippet]);
  const highlightedUsage   = useMemo(() => highlightCode(USAGE_SNIPPETS[activeUsage].code), [activeUsage]);

  const totalBuffered = NAMESPACES.reduce((n, ns) => n + loggerMap[ns].getStats().logCount, 0);

  return (
    <>
      {/* Top nav */}
      <nav style={s.topNav}>
        <span style={s.topNavBrand}>konsole<span style={{ color: '#6366f1' }}>.ts</span></span>
        <div style={s.topNavLinks}>
          <a style={s.topNavLink} href={LINKS.docs} target="_blank" rel="noreferrer">Docs</a>
          <a style={s.topNavLink} href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </nav>

      <div style={{ ...s.container, paddingBottom: drawerOpen ? 440 : 80 }}>

        {/* Header */}
        <header style={s.header}>
          <div style={s.headerBadge}>Browser + Node.js · Structured logging</div>
          <h1 style={s.title}>Konsole</h1>
          <p style={s.subtitle}>
            Structured, namespaced logging with beautiful terminal output, child loggers,
            and flexible transports.
          </p>
        </header>

        {/* ── Installation ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Installation</h2>
          <div style={s.installGrid}>
            {[
              { label: 'npm',  cmd: 'npm install konsole-logger' },
              { label: 'yarn', cmd: 'yarn add konsole-logger' },
              { label: 'pnpm', cmd: 'pnpm add konsole-logger' },
            ].map(({ label, cmd }) => (
              <div
                key={label}
                style={s.installCard}
                onMouseEnter={(e) => { const btn = e.currentTarget.querySelector('button'); if (btn) btn.style.opacity = '1'; }}
                onMouseLeave={(e) => { const btn = e.currentTarget.querySelector('button'); if (btn) btn.style.opacity = '0'; }}
              >
                <span style={s.installLabel}>{label}</span>
                <code style={s.installCmd}>{cmd}</code>
                <button
                  style={s.installCopy}
                  onClick={() => { navigator.clipboard.writeText(cmd); }}
                  aria-label={`Copy ${label} command`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Interactive Demo ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Interactive Demo</h2>

          {/* Namespace */}
          <div style={s.row}>
            <span style={s.rowLabel}>Namespace</span>
            <div style={s.tabs}>
              {NAMESPACES.map((ns) => (
                <button key={ns} onClick={() => setActiveNs(ns)}
                  style={{ ...s.tab, ...(activeNs === ns ? s.tabActive : {}) }}>
                  {ns}
                </button>
              ))}
            </div>
          </div>

          {/* Child logger toggle */}
          <div style={s.row}>
            <span style={s.rowLabel}>Child Logger</span>
            <label style={s.toggle}>
              <input
                type="checkbox"
                checked={useChild}
                onChange={(e) => setUseChild(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{ ...s.toggleTrack, ...(useChild ? s.toggleTrackOn : {}) }}>
                <span style={{ ...s.toggleThumb, ...(useChild ? s.toggleThumbOn : {}) }} />
              </span>
              <span style={s.toggleLabel}>
                {useChild
                  ? <><span style={s.pill}>requestId</span> <span style={s.pill}>userId</span> bound</>
                  : 'off'}
              </span>
            </label>
          </div>

          {/* Log level buttons */}
          <div style={s.row}>
            <span style={s.rowLabel}>Log Level</span>
            <div style={s.actions}>
              {LEVELS.map((level) => (
                <button key={level} onClick={() => handleLog(level)}
                  style={{ ...s.btn, borderLeft: `3px solid ${LEVEL_BTN_BORDER[level]}` }}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={s.row}>
            <span style={s.rowLabel}>Controls</span>
            <div style={s.actions}>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setDrawerOpen(true)}>
                View Buffer
              </button>
              <button style={s.btn} onClick={toggleGlobalPrint}>
                Print {globalPrint ? 'on' : 'off'}
              </button>
              <button style={s.btn} onClick={clearAll}>Clear All</button>
            </div>
          </div>
        </section>

        {/* Output console */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Output</h2>
          <div style={s.console}>
            <div style={s.consoleHeader}>
              <div style={s.consoleDots}>
                <span style={{ ...s.consoleDot, background: '#fca5a5' }} />
                <span style={{ ...s.consoleDot, background: '#fcd34d' }} />
                <span style={{ ...s.consoleDot, background: '#86efac' }} />
              </div>
              <span style={s.consoleLabel}>live output</span>
              <span style={s.consoleStats}>{displayLogs.length} lines</span>
            </div>
            <div style={s.consoleBody} ref={consoleRef}>
              {displayLogs.length === 0 ? (
                <div style={s.emptyState}>Click a log level above to start →</div>
              ) : (
                displayLogs.map((log) => (
                  <div key={log.id} style={s.logLine}>
                    <span style={s.logTime}>{formatTime(log.timestamp)}</span>
                    <span style={{ ...s.logBadge, ...LEVEL_STYLE[log.level] }}>
                      {log.level.slice(0, 3).toUpperCase()}
                    </span>
                    <span style={s.logNs}>[{log.namespace}]</span>
                    <span style={s.logMsg}>{log.msg}</span>
                    {Object.keys(log.fields).length > 0 && (
                      <span style={s.logFields}>{formatFields(log.fields)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Status bar */}
        <div style={s.statusBar}>
          <StatusItem dot={globalPrint} label="Print" value={globalPrint ? 'on' : 'off'} />
          <StatusItem label="Active" value={activeNs} />
          <StatusItem dot={useChild} label="Child" value={useChild ? 'on' : 'off'} />
          <StatusItem label="Buffered" value={`${totalBuffered} entries`} />
        </div>

        {/* ── Feature Documentation ── */}
        <section style={{ ...s.section, marginTop: 64 }}>
          <h2 style={s.sectionTitle}>How it Works</h2>
          <p style={s.prose}>
            Konsole works in browser and Node.js. It automatically picks the best output format
            for each environment and stores every log in a circular buffer for later inspection.
          </p>

          {/* Feature grid */}
          <div style={s.featureGrid}>
            {[
              { icon: '📊', title: 'Structured logging', body: 'Every entry carries msg, fields, level, levelValue, namespace and timestamp — compatible with Datadog, Loki, and any log aggregator.' },
              { icon: '🏷️', title: 'Child loggers', body: 'logger.child({ requestId }) creates an ephemeral child that injects context into every line it produces. Bindings accumulate through nesting.' },
              { icon: '🎨', title: 'Auto formatting', body: "TTY terminal → ANSI pretty. Pipe / CI → NDJSON. Browser → styled %c badges. One format: 'auto' option handles it all." },
              { icon: '🚚', title: 'Transports', body: 'HttpTransport, FileTransport, StreamTransport, ConsoleTransport. Add multiple to one logger. Filter and transform per transport.' },
              { icon: '💾', title: 'Circular buffer', body: 'maxLogs: 1000 keeps only the last 1000 entries in memory — no unbounded growth in long-running apps.' },
              { icon: '⚡', title: 'Web Worker', body: 'useWorker: true offloads storage and HTTP transport to a background thread — keeps the main thread free in high-volume browser apps.' },
            ].map(({ icon, title, body }) => (
              <div key={title} style={s.featureCard}>
                <div style={s.featureIcon}>{icon}</div>
                <div style={s.featureTitle}>{title}</div>
                <div style={s.featureBody}>{body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Code Snippets ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Code Snippets</h2>
          <div style={s.snippetTabs}>
            {CODE_SNIPPETS.map((snip, i) => (
              <button key={i} onClick={() => setActiveSnippet(i)}
                style={{ ...s.snippetTab, ...(activeSnippet === i ? s.snippetTabActive : {}) }}>
                {snip.title}
              </button>
            ))}
          </div>
          <div style={s.snippetCard}>
            <p style={s.snippetDesc}>{CODE_SNIPPETS[activeSnippet].description}</p>
            <pre style={s.pre}><code style={s.code}>{highlightedSnippet}</code></pre>
          </div>
        </section>

        {/* ── Usage Examples ── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Usage Examples</h2>
          <p style={s.prose}>
            Konsole has no framework dependency — it works everywhere: React, plain HTML, and Node.js servers.
          </p>
          <div style={s.snippetTabs}>
            {USAGE_SNIPPETS.map((snip, i) => (
              <button key={i} onClick={() => setActiveUsage(i)}
                style={{ ...s.snippetTab, ...(activeUsage === i ? s.snippetTabActive : {}) }}>
                {snip.title}
              </button>
            ))}
          </div>
          <div style={s.snippetCard}>
            <p style={s.snippetDesc}>{USAGE_SNIPPETS[activeUsage].description}</p>
            <pre style={s.pre}><code style={s.code}>{highlightedUsage}</code></pre>
          </div>
        </section>

        {/* Footer */}
        <footer style={s.footer}>
          <p style={{ ...s.footerText, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            Created by{' '}
            <a style={{ ...s.footerLink, fontWeight: 500 }} href={LINKS.portfolio} target="_blank" rel="noreferrer">Sakti Kumar Chourasia</a>
            <a style={{ ...s.footerLink, display: 'inline-flex' }} href={LINKS.authorGh} target="_blank" rel="noreferrer" aria-label="GitHub profile">
              <GithubIcon size={16} />
            </a>
          </p>
          <p style={s.footerText}>
            konsole-logger · MIT ·{' '}
            <a style={s.footerLink} href={LINKS.docs} target="_blank" rel="noreferrer">Docs</a> ·{' '}
            <a style={s.footerLink} href={LINKS.github} target="_blank" rel="noreferrer">GitHub</a>
          </p>
        </footer>
      </div>

      {/* Drawer overlay */}
      <div style={{ ...s.drawerOverlay, ...(drawerOpen ? s.drawerOverlayOpen : {}) }}
        onClick={() => setDrawerOpen(false)} />

      {/* Log buffer drawer */}
      <div style={{ ...s.drawer, ...(drawerOpen ? s.drawerOpen : {}) }}>
        <div style={s.drawerHandle} onClick={() => setDrawerOpen(false)} />
        <div style={s.drawerHeader}>
          <div style={s.drawerTitle}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>›</span> Buffer
          </div>
          <div style={s.drawerFilters}>
            <div style={s.drawerFilterGroup}>
              <span style={s.drawerFilterLabel}>Level</span>
              <div style={s.drawerTabs}>
                {(['all', ...LEVELS] as const).map((f) => (
                  <button key={f} onClick={() => setTypeFilter(f as 'all' | Level)}
                    style={{ ...s.drawerTab, ...(typeFilter === f ? s.drawerTabActive : {}) }}>
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.drawerFilterGroup}>
              <span style={s.drawerFilterLabel}>Namespace</span>
              <div style={s.drawerTabs}>
                {(['all', ...NAMESPACES] as const).map((ns) => (
                  <button key={ns} onClick={() => setNsFilter(ns)}
                    style={{ ...s.drawerTab, ...(nsFilter === ns ? s.drawerTabNsActive : {}) }}>
                    {ns === 'all' ? 'All' : ns}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button style={s.drawerClose} onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div style={s.drawerContent}>
          {getFilteredLogs().length === 0
            ? <div style={s.drawerEmpty}>No entries match the current filter</div>
            : getFilteredLogs().map((log, i) => (
              <div key={i} style={s.drawerLogLine}>
                <span style={{ ...s.drawerBadge, color: LEVEL_STYLE[log.level as Level].color, background: LEVEL_STYLE[log.level as Level].background }}>
                  {log.level.slice(0, 3).toUpperCase()}
                </span>
                <span style={s.drawerTime}>{formatTime(log.timestamp)}</span>
                <span style={s.drawerNs}>[{log.namespace}]</span>
                <span style={s.drawerMsg}>{log.msg}</span>
                {Object.keys(log.fields ?? {}).length > 0 && (
                  <span style={s.drawerFields}>{formatFields(log.fields ?? {})}</span>
                )}
              </div>
            ))
          }
        </div>
        <div style={s.drawerFooter}>
          <div>
            <span style={s.drawerStat}>Showing: <b style={{ color: '#a3a3a3' }}>{getFilteredLogs().length}</b></span>
            <span style={s.drawerStat}>Total: <b style={{ color: '#a3a3a3' }}>{getAllLogs().length}</b></span>
          </div>
          <span>Press Esc to close</span>
        </div>
      </div>
    </>
  );
}

function StatusItem({ dot, label, value }: { dot?: boolean; label: string; value: string }) {
  return (
    <div style={s.statusItem}>
      {dot !== undefined && (
        <span style={{ ...s.statusDot, ...(dot ? s.statusDotOn : {}) }} />
      )}
      <span style={s.statusLabel}>{label}</span>
      <span style={s.statusValue}>{value}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  // Top nav
  topNav:      { position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,250,250,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 },
  topNavBrand: { fontSize: 15, fontWeight: 700, color: '#171717', letterSpacing: '-0.02em' },
  topNavLinks: { display: 'flex', gap: 4 },
  topNavLink:  { fontSize: 13, fontWeight: 500, color: '#737373', textDecoration: 'none', padding: '6px 12px', borderRadius: 6, transition: 'color 0.15s' },

  container: { maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px', transition: 'padding-bottom 0.3s ease' },

  // Header
  header:      { marginBottom: 56 },
  headerBadge: { display: 'inline-block', fontSize: 12, fontWeight: 500, color: '#6366f1', background: '#eef2ff', padding: '4px 10px', borderRadius: 20, marginBottom: 16, letterSpacing: '0.02em' },
  title:       { fontSize: 28, fontWeight: 700, color: '#171717', marginBottom: 12, letterSpacing: '-0.02em' },
  subtitle:    { fontSize: 16, color: '#737373', lineHeight: 1.6, maxWidth: 520 },

  // Installation
  installGrid:  { display: 'flex', flexDirection: 'column', gap: 8 },
  installCard:  { display: 'flex', alignItems: 'center', gap: 10, background: '#1e1e1e', borderRadius: 8, padding: '10px 14px', position: 'relative' },
  installLabel: { fontFamily: 'var(--font-mono), monospace', fontSize: 11, fontWeight: 600, color: '#6366f1', minWidth: 36 },
  installCmd:   { fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: '#d4d4d4', flex: 1, whiteSpace: 'nowrap' },
  installCopy:  { background: 'transparent', borderWidth: 0, color: '#525252', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' },

  // Section
  section:      { marginBottom: 48 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 },
  prose:        { fontSize: 15, color: '#525252', lineHeight: 1.7, marginBottom: 24 },

  // Rows
  row:      { display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' },
  rowLabel: { fontSize: 13, fontWeight: 500, color: '#737373', paddingTop: 10, minWidth: 100 },

  // Tabs
  tabs:      { display: 'flex', gap: 4, background: '#f5f5f5', padding: 4, borderRadius: 8, width: 'fit-content' },
  tab:       { fontFamily: 'var(--font-sans), inherit', fontSize: 14, fontWeight: 500, padding: '8px 16px', background: 'transparent', border: 'none', borderRadius: 6, color: '#737373', cursor: 'pointer' },
  tabActive: { background: 'white', color: '#171717', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' },

  // Toggle
  toggle:        { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', paddingTop: 6 },
  toggleTrack:   { width: 40, height: 22, background: '#e5e5e5', borderRadius: 11, position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleTrackOn: { background: '#6366f1' },
  toggleThumb:   { position: 'absolute', top: 3, left: 3, width: 16, height: 16, background: 'white', borderRadius: '50%', transition: 'transform 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.15)' },
  toggleThumbOn: { transform: 'translateX(18px)' },
  toggleLabel:   { fontSize: 13, color: '#525252', display: 'flex', alignItems: 'center', gap: 6 },
  pill:          { background: '#eef2ff', color: '#6366f1', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 10, fontFamily: 'var(--font-mono), monospace' },

  // Action buttons
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  btn: {
    fontFamily: 'var(--font-sans), inherit', fontSize: 13, fontWeight: 500, padding: '8px 14px',
    background: 'white', borderWidth: 1, borderStyle: 'solid', borderColor: '#e5e5e5', borderRadius: 8,
    color: '#171717', cursor: 'pointer',
  },
  btnPrimary: { background: '#171717', borderColor: '#171717', color: 'white' },

  // Console output
  console:       { background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden' },
  consoleHeader: { display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f0f0f0', gap: 10 },
  consoleDots:   { display: 'flex', gap: 5 },
  consoleDot:    { width: 10, height: 10, borderRadius: '50%' },
  consoleLabel:  { fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: '#d4d4d4', flex: 1 },
  consoleStats:  { fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: '#a3a3a3' },
  consoleBody:   { padding: 14, maxHeight: 280, overflowY: 'auto', fontFamily: 'var(--font-mono), monospace', fontSize: 12 },
  emptyState:    { color: '#a3a3a3', textAlign: 'center', padding: '28px 0', fontSize: 13 },
  logLine:       { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '5px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'baseline' },
  logTime:       { color: '#c4c4c4', fontSize: 11, whiteSpace: 'nowrap' },
  logBadge:      { fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3 },
  logNs:         { color: '#a78bfa', fontSize: 11 },
  logMsg:        { color: '#262626', flex: 1, minWidth: 120 },
  logFields:     { color: '#a3a3a3', fontSize: 11 },

  // Status bar
  statusBar:   { display: 'flex', gap: 24, flexWrap: 'wrap', padding: '12px 0', borderTop: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5', marginBottom: 48 },
  statusItem:  { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#737373' },
  statusDot:   { width: 7, height: 7, borderRadius: '50%', background: '#d4d4d4', transition: 'background 0.2s' },
  statusDotOn: { background: '#22c55e' },
  statusLabel: { color: '#a3a3a3' },
  statusValue: { fontWeight: 500, color: '#171717' },

  // Feature grid
  featureGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginTop: 8 },
  featureCard:  { padding: '16px 18px', background: 'white', border: '1px solid #f0f0f0', borderRadius: 10 },
  featureIcon:  { fontSize: 20, marginBottom: 8 },
  featureTitle: { fontSize: 13, fontWeight: 600, color: '#171717', marginBottom: 6 },
  featureBody:  { fontSize: 13, color: '#737373', lineHeight: 1.6 },

  // Code snippets
  snippetTabs:      { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 },
  snippetTab:       { fontFamily: 'var(--font-sans), inherit', fontSize: 13, fontWeight: 500, padding: '7px 14px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: '#e5e5e5', borderRadius: 6, color: '#737373', cursor: 'pointer' },
  snippetTabActive: { background: '#171717', borderColor: '#171717', color: 'white' },
  snippetCard:      { background: 'white', border: '1px solid #e5e5e5', borderRadius: 10, overflow: 'hidden' },
  snippetDesc:      { fontSize: 13, color: '#737373', padding: '14px 18px', borderBottom: '1px solid #f0f0f0' },
  pre:              { margin: 0, padding: '18px', overflowX: 'auto', background: '#1e1e1e' },
  code:             { fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: '#d4d4d4', lineHeight: 1.7 },

  // Footer
  footer:     { marginTop: 64, paddingTop: 24, borderTop: '1px solid #f0f0f0' },
  footerText: { fontSize: 13, color: '#a3a3a3' },
  footerLink: { color: '#737373', textDecoration: 'none' },

  // Drawer
  drawerOverlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', opacity: 0, visibility: 'hidden', transition: 'all 0.25s', zIndex: 100 },
  drawerOverlayOpen: { opacity: 1, visibility: 'visible' },
  drawer:            { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#1a1a1a', borderRadius: '16px 16px 0 0', transform: 'translateY(100%)', transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)', zIndex: 101, maxHeight: '72vh', display: 'flex', flexDirection: 'column' },
  drawerOpen:        { transform: 'translateY(0)' },
  drawerHandle:      { display: 'flex', justifyContent: 'center', padding: 10, cursor: 'grab' },
  drawerHeader:      { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 16px 12px', borderBottom: '1px solid #2a2a2a', gap: 16 },
  drawerTitle:       { fontFamily: 'var(--font-mono), monospace', fontSize: 13, fontWeight: 500, color: '#737373', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' },
  drawerFilters:     { display: 'flex', gap: 20, flex: 1, justifyContent: 'center', flexWrap: 'wrap' },
  drawerFilterGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  drawerFilterLabel: { fontFamily: 'var(--font-mono), monospace', fontSize: 10, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em' },
  drawerTabs:        { display: 'flex', gap: 2, flexWrap: 'wrap' },
  drawerTab:         { fontFamily: 'var(--font-mono), monospace', fontSize: 11, padding: '5px 10px', background: 'transparent', border: 'none', borderRadius: 4, color: '#737373', cursor: 'pointer' },
  drawerTabActive:   { background: '#2a2a2a', color: '#e5e5e5' },
  drawerTabNsActive: { background: '#2e2b45', color: '#a78bfa' },
  drawerClose:       { fontFamily: 'var(--font-sans), inherit', fontSize: 18, padding: '4px 8px', background: 'transparent', border: 'none', color: '#737373', cursor: 'pointer', lineHeight: 1 },
  drawerContent:     { flex: 1, overflowY: 'auto', padding: 14, fontFamily: 'var(--font-mono), monospace', fontSize: 12, lineHeight: 1.6 },
  drawerLogLine:     { display: 'flex', flexWrap: 'wrap', gap: 8, padding: '5px 0', borderBottom: '1px solid #252525', alignItems: 'baseline' },
  drawerBadge:       { fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3, flexShrink: 0 },
  drawerTime:        { color: '#4a4a4a', minWidth: 70 },
  drawerNs:          { color: '#a78bfa' },
  drawerMsg:         { color: '#e5e5e5', flex: 1 },
  drawerFields:      { color: '#525252', fontSize: 11 },
  drawerEmpty:       { color: '#525252', textAlign: 'center', padding: '48px 16px', fontSize: 13 },
  drawerFooter:      { padding: '10px 16px', borderTop: '1px solid #252525', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: '#4a4a4a' },
  drawerStat:        { color: '#525252', marginRight: 16 },
};
