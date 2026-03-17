import { CircularBuffer } from './CircularBuffer';
import type { SerializableLogEntry, WorkerMessage, TransportConfig } from './types';

// Note: this file is the typed reference implementation of the worker.
// The runtime-loaded worker is the inline string in Konsole.getWorkerCode().
// Keep the two in sync when making structural changes.

/**
 * Worker-side log storage using circular buffers per namespace
 */
const logBuffers = new Map<string, CircularBuffer<SerializableLogEntry>>();
const bufferConfigs = new Map<string, { maxLogs: number; retentionPeriod: number }>();

// Transport handling in worker
interface WorkerTransport {
  config: TransportConfig;
  batch: SerializableLogEntry[];
  flushTimer?: ReturnType<typeof setInterval>;
}

const transports = new Map<string, WorkerTransport>();

function getOrCreateBuffer(namespace: string): CircularBuffer<SerializableLogEntry> {
  let buffer = logBuffers.get(namespace);
  if (!buffer) {
    const config = bufferConfigs.get(namespace) ?? { maxLogs: 10000, retentionPeriod: 48 * 60 * 60 * 1000 };
    buffer = new CircularBuffer<SerializableLogEntry>(config.maxLogs);
    logBuffers.set(namespace, buffer);
  }
  return buffer;
}

function addLog(namespace: string, entry: SerializableLogEntry): void {
  const buffer = getOrCreateBuffer(namespace);
  buffer.push(entry);

  // Send to all transports
  transports.forEach((transport) => {
    transport.batch.push(entry);
    if (transport.batch.length >= (transport.config.batchSize ?? 50)) {
      flushTransport(transport);
    }
  });
}

function getLogs(namespace: string): SerializableLogEntry[] {
  const buffer = logBuffers.get(namespace);
  return buffer ? buffer.toArray() : [];
}

function clearLogs(namespace: string): void {
  const buffer = logBuffers.get(namespace);
  if (buffer) {
    buffer.clear();
  }
}

function flushOldLogs(namespace: string): void {
  const buffer = logBuffers.get(namespace);
  const config = bufferConfigs.get(namespace);
  if (!buffer || !config) return;

  const cutoffTime = new Date(Date.now() - config.retentionPeriod).toISOString();
  buffer.retain((entry) => entry.timestamp > cutoffTime);
}

function configureNamespace(namespace: string, maxLogs: number, retentionPeriod: number): void {
  bufferConfigs.set(namespace, { maxLogs, retentionPeriod });
  
  // Recreate buffer with new capacity if needed
  const existing = logBuffers.get(namespace);
  if (existing) {
    const entries = existing.toArray();
    const newBuffer = new CircularBuffer<SerializableLogEntry>(maxLogs);
    entries.slice(-maxLogs).forEach((e) => newBuffer.push(e));
    logBuffers.set(namespace, newBuffer);
  }
}

async function flushTransport(transport: WorkerTransport): Promise<void> {
  if (transport.batch.length === 0) return;

  const toSend = [...transport.batch];
  transport.batch = [];

  try {
    const response = await fetch(transport.config.url, {
      method: transport.config.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(transport.config.headers ?? {}),
      },
      body: JSON.stringify({
        transport: transport.config.name,
        logs: toSend,
        sentAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn(`[Konsole Worker] Transport ${transport.config.name} failed: ${response.status}`);
    }
  } catch (error) {
    console.warn(`[Konsole Worker] Transport ${transport.config.name} error:`, error);
  }
}

function addTransport(config: TransportConfig): void {
  const transport: WorkerTransport = {
    config,
    batch: [],
  };

  transport.flushTimer = setInterval(() => {
    flushTransport(transport);
  }, config.flushInterval ?? 10000);

  transports.set(config.name, transport);
}

// Message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, namespace, requestId } = event.data;

  switch (type) {
    case 'ADD_LOG':
      if (namespace && payload) {
        addLog(namespace, payload as SerializableLogEntry);
      }
      break;

    case 'GET_LOGS':
      if (namespace) {
        const logs = getLogs(namespace);
        self.postMessage({
          type: 'LOGS_RESPONSE',
          payload: logs,
          namespace,
          requestId,
        });
      }
      break;

    case 'CLEAR_LOGS':
      if (namespace) {
        clearLogs(namespace);
      }
      break;

    case 'FLUSH_OLD':
      if (namespace) {
        flushOldLogs(namespace);
      }
      break;

    case 'CONFIGURE':
      if (namespace && payload) {
        const config = payload as { maxLogs: number; retentionPeriod: number; transports?: TransportConfig[] };
        configureNamespace(namespace, config.maxLogs, config.retentionPeriod);
        
        // Add transports if provided
        if (config.transports) {
          config.transports.forEach(addTransport);
        }
      }
      break;

    case 'FLUSH_TRANSPORT':
      if (payload) {
        const transportName = payload as string;
        const transport = transports.get(transportName);
        if (transport) {
          flushTransport(transport);
        }
      }
      break;
  }
};

// Periodic cleanup for all buffers
setInterval(() => {
  logBuffers.forEach((_, namespace) => {
    flushOldLogs(namespace);
  });
}, 60 * 60 * 1000); // Every hour

