import { useState, useEffect, useCallback } from "react";
import { Konsole, LogEntry } from "konsole-logger";

// Create loggers for different features
const appLogger = new Konsole({ namespace: "App", criteria: false });
const authLogger = new Konsole({ namespace: "Auth", criteria: false });
const apiLogger = new Konsole({ namespace: "API", criteria: false });

// Expose to window for debugging
Konsole.exposeToWindow();

type LogType = "log" | "info" | "warn" | "error";

interface DisplayLog {
  id: number;
  type: LogType;
  namespace: string;
  message: string;
  timestamp: Date;
}

const loggerMap: Record<string, Konsole> = {
  App: appLogger,
  Auth: authLogger,
  API: apiLogger,
};

const randomMessages: Record<LogType, string[]> = {
  log: [
    "Component rendered",
    "State updated",
    "Effect triggered",
    "Callback executed",
    "Props received",
  ],
  info: [
    "User session active",
    "Data loaded successfully",
    "Cache hit",
    "Websocket connected",
    "Sync complete",
  ],
  warn: [
    "Performance degraded",
    "Missing translations",
    "Deprecated prop used",
    "Memory usage high",
    "Rate limit approaching",
  ],
  error: [
    "Render failed",
    "API returned 500",
    "Network unreachable",
    "Invalid state detected",
    "Unhandled exception",
  ],
};

function App() {
  const [activeNamespace, setActiveNamespace] = useState("App");
  const [globalPrint, setGlobalPrint] = useState(false);
  const [displayLogs, setDisplayLogs] = useState<DisplayLog[]>([]);
  const [logIdCounter, setLogIdCounter] = useState(0);

  const namespaces = ["App", "Auth", "API"];

  const addDisplayLog = useCallback(
    (type: LogType, namespace: string, message: string) => {
      setLogIdCounter((prev) => {
        const newId = prev + 1;
        setDisplayLogs((logs) => [
          ...logs.slice(-49),
          {
            id: newId,
            type,
            namespace,
            message,
            timestamp: new Date(),
          },
        ]);
        return newId;
      });
    },
    []
  );

  const handleLog = (type: LogType) => {
    const logger = loggerMap[activeNamespace];
    const messages = randomMessages[type];
    const message = messages[Math.floor(Math.random() * messages.length)];

    logger[type](message, { component: "App", timestamp: Date.now() });
    addDisplayLog(type, activeNamespace, message);
  };

  const toggleGlobalPrint = () => {
    const newState = !globalPrint;
    setGlobalPrint(newState);
    Konsole.enableGlobalPrint(newState);
    addDisplayLog(
      "info",
      "System",
      `Global print ${newState ? "enabled" : "disabled"}`
    );
  };

  const viewLogs = () => {
    const logger = loggerMap[activeNamespace];
    console.log(`\n📋 Viewing logs for [${activeNamespace}]:`);
    logger.viewLogs();
    addDisplayLog("info", "System", `Check console for ${activeNamespace} logs`);
  };

  const clearLogs = () => {
    const logger = loggerMap[activeNamespace];
    logger.clearLogs();
    addDisplayLog("info", "System", `Cleared logs for ${activeNamespace}`);
  };

  const getTotalLogs = () => {
    return Object.values(loggerMap).reduce(
      (acc, logger) => acc + logger.getLogs().length,
      0
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.icon}>⚛️</span> Konsole
        </h1>
        <p style={styles.subtitle}>React Integration Example</p>
      </header>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Namespace</h2>
          <div style={styles.namespaceGrid}>
            {namespaces.map((ns) => (
              <button
                key={ns}
                onClick={() => setActiveNamespace(ns)}
                style={{
                  ...styles.namespaceBtn,
                  ...(activeNamespace === ns ? styles.namespaceBtnActive : {}),
                }}
              >
                {ns}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Log Actions</h2>
          <div style={styles.buttonGrid}>
            <button
              onClick={() => handleLog("log")}
              style={{ ...styles.btn, ...styles.btnLog }}
            >
              Log
            </button>
            <button
              onClick={() => handleLog("info")}
              style={{ ...styles.btn, ...styles.btnInfo }}
            >
              Info
            </button>
            <button
              onClick={() => handleLog("warn")}
              style={{ ...styles.btn, ...styles.btnWarn }}
            >
              Warn
            </button>
            <button
              onClick={() => handleLog("error")}
              style={{ ...styles.btn, ...styles.btnError }}
            >
              Error
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Controls</h2>
          <div style={styles.buttonGrid}>
            <button
              onClick={viewLogs}
              style={{ ...styles.btn, ...styles.btnPrimary }}
            >
              View Logs
            </button>
            <button
              onClick={toggleGlobalPrint}
              style={{
                ...styles.btn,
                ...(globalPrint ? styles.btnSuccess : styles.btnSecondary),
              }}
            >
              {globalPrint ? "🔊 Print ON" : "🔇 Print OFF"}
            </button>
            <button
              onClick={clearLogs}
              style={{ ...styles.btn, ...styles.btnSecondary }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Live Feed</h2>
        <div style={styles.logDisplay}>
          {displayLogs.length === 0 ? (
            <div style={styles.emptyState}>
              No logs yet. Start logging above! 👆
            </div>
          ) : (
            displayLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  ...styles.logEntry,
                  ...styles[`logEntry${capitalize(log.type)}` as keyof typeof styles],
                }}
              >
                <span style={styles.logTime}>
                  {log.timestamp.toLocaleTimeString("en-US", { hour12: false })}
                </span>
                <span style={styles.logNamespace}>[{log.namespace}]</span>
                <span style={styles.logMessage}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: globalPrint ? "#34d399" : "#f87171",
            }}
          />
          <span>Global Print: {globalPrint ? "ON" : "OFF"}</span>
        </div>
        <div style={styles.statusItem}>
          <span>Active: {activeNamespace}</span>
        </div>
        <div style={styles.statusItem}>
          <span>Total Stored: {getTotalLogs()}</span>
        </div>
      </div>

      <div style={styles.tip}>
        <strong>💡 React Hook Tip:</strong> Create a custom{" "}
        <code style={styles.code}>useLogger</code> hook that returns a
        namespaced logger for your components!
      </div>
    </div>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "2rem",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #818cf8, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  icon: {
    WebkitTextFillColor: "initial",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  card: {
    background: "rgba(26, 26, 62, 0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: 16,
    padding: "1.5rem",
    border: "1px solid rgba(129, 140, 248, 0.2)",
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "0.75rem",
    color: "#818cf8",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "1rem",
    fontWeight: 600,
  },
  namespaceGrid: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  namespaceBtn: {
    padding: "0.5rem 1rem",
    background: "rgba(18, 18, 42, 0.8)",
    border: "2px solid transparent",
    borderRadius: 20,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  namespaceBtnActive: {
    borderColor: "#818cf8",
    color: "#818cf8",
    background: "rgba(129, 140, 248, 0.1)",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem",
  },
  btn: {
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    transition: "all 0.2s",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  btnLog: {
    background: "rgba(18, 18, 42, 0.8)",
    color: "#f1f5f9",
    border: "1px solid #475569",
  },
  btnInfo: {
    background: "#3b82f6",
    color: "white",
  },
  btnWarn: {
    background: "#f59e0b",
    color: "black",
  },
  btnError: {
    background: "#ef4444",
    color: "white",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #818cf8, #c084fc)",
    color: "white",
  },
  btnSuccess: {
    background: "#10b981",
    color: "white",
  },
  btnSecondary: {
    background: "rgba(18, 18, 42, 0.8)",
    color: "#94a3b8",
    border: "1px solid #475569",
  },
  logDisplay: {
    background: "rgba(12, 12, 29, 0.8)",
    borderRadius: 10,
    padding: "1rem",
    maxHeight: 280,
    overflowY: "auto",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.8rem",
  },
  emptyState: {
    color: "#64748b",
    textAlign: "center",
    padding: "2rem",
  },
  logEntry: {
    display: "flex",
    gap: "0.75rem",
    padding: "0.5rem 0.75rem",
    borderRadius: 6,
    marginBottom: "0.25rem",
    alignItems: "center",
  },
  logEntryLog: {
    background: "rgba(255, 255, 255, 0.05)",
  },
  logEntryInfo: {
    background: "rgba(59, 130, 246, 0.15)",
    borderLeft: "3px solid #60a5fa",
  },
  logEntryWarn: {
    background: "rgba(245, 158, 11, 0.15)",
    borderLeft: "3px solid #fbbf24",
  },
  logEntryError: {
    background: "rgba(239, 68, 68, 0.15)",
    borderLeft: "3px solid #f87171",
  },
  logTime: {
    color: "#64748b",
    fontSize: "0.7rem",
    whiteSpace: "nowrap",
  },
  logNamespace: {
    color: "#818cf8",
    fontWeight: 600,
    minWidth: 50,
  },
  logMessage: {
    color: "#e2e8f0",
  },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.5rem",
    background: "rgba(18, 18, 42, 0.8)",
    borderRadius: 10,
    fontSize: "0.8rem",
    color: "#94a3b8",
    marginTop: "1rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  statusItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  tip: {
    marginTop: "1.5rem",
    padding: "1rem 1.5rem",
    background: "rgba(129, 140, 248, 0.1)",
    border: "1px solid rgba(129, 140, 248, 0.3)",
    borderRadius: 10,
    fontSize: "0.85rem",
    lineHeight: 1.6,
  },
  code: {
    background: "rgba(12, 12, 29, 0.8)",
    padding: "0.2rem 0.5rem",
    borderRadius: 4,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
  },
};

export default App;


