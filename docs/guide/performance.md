# Performance Optimization

Konsole includes several features to optimize performance in production applications.

## Circular Buffer

By default, Konsole stores up to 10,000 logs in a circular buffer. When the limit is reached, oldest logs are automatically evicted.

```typescript
const logger = new Konsole({
  namespace: 'App',
  maxLogs: 5000, // Reduce memory footprint
});
```

### Benefits

- **Constant memory usage** - Never grows beyond the limit
- **No manual cleanup** - Automatic eviction of old logs
- **Fast operations** - O(1) push and evict

### Checking Usage

```typescript
const stats = logger.getStats();
console.log(stats.memoryUsage); // "1234/5000 (24.7%)"
```

## Web Worker

Offload log processing to a background thread:

```typescript
const logger = new Konsole({
  namespace: 'App',
  useWorker: true,
});
```

### Benefits

- **Non-blocking** - Main thread stays responsive
- **Better performance** - Log processing in background
- **Same API** - No code changes needed

### Considerations

- Only works in browsers (ignored in Node.js)
- Use `getLogsAsync()` for log retrieval
- Slightly higher memory overhead

### When to Use

✅ High-volume logging (100+ logs/second)
✅ Performance-critical UI applications
✅ Long-running single-page apps

❌ Simple applications with low log volume
❌ Server-side Node.js applications
❌ When you need synchronous log access

## Combining Features

For maximum optimization:

```typescript
const logger = new Konsole({
  namespace: 'HighPerformance',
  maxLogs: 1000,          // Minimal memory
  useWorker: true,        // Background processing
  criteria: false,        // No console output
  retentionPeriod: 3600000, // 1 hour retention
  transports: [{
    name: 'backend',
    url: '/api/logs',
    batchSize: 100,       // Batch network requests
    flushInterval: 30000, // Reduce flush frequency
    filter: (e) => e.logtype === 'error', // Only send errors
  }]
});
```

## Benchmarks

Approximate performance characteristics:

| Operation | Without Worker | With Worker |
|-----------|---------------|-------------|
| `log()` | ~0.01ms | ~0.005ms |
| `getLogs()` | ~0.1ms | N/A (use async) |
| `getLogsAsync()` | ~0.5ms | ~1ms |
| Memory (10k logs) | ~2MB | ~2MB + worker overhead |

## Production Tips

### 1. Disable Console Output

```typescript
const logger = new Konsole({
  namespace: 'App',
  criteria: process.env.NODE_ENV === 'development',
});
```

### 2. Use Smaller Buffers

```typescript
// Development: keep more logs for debugging
const maxLogs = process.env.NODE_ENV === 'development' ? 10000 : 1000;

const logger = new Konsole({
  namespace: 'App',
  maxLogs,
});
```

### 3. Filter Expensive Operations

```typescript
const logger = new Konsole({
  namespace: 'App',
  criteria: (entry) => {
    // Only print in development or for errors
    if (process.env.NODE_ENV === 'development') return true;
    return entry.logtype === 'error';
  },
});
```

### 4. Batch Transport Requests

```typescript
{
  name: 'backend',
  url: '/api/logs',
  batchSize: 100,       // Wait for 100 logs
  flushInterval: 60000, // Or flush every minute
}
```

### 5. Clean Up Loggers

```typescript
// In React
useEffect(() => {
  const logger = new Konsole({ namespace: 'Component' });
  
  return () => {
    logger.destroy(); // Clean up on unmount
  };
}, []);
```

## Memory Profiling

Monitor memory usage in your application:

```typescript
// Log memory stats periodically
setInterval(() => {
  const namespaces = Konsole.getNamespaces();
  const stats = namespaces.map(ns => ({
    namespace: ns,
    ...Konsole.getLogger(ns).getStats(),
  }));
  console.table(stats);
}, 60000);
```

Example output:

| namespace | logCount | maxLogs | memoryUsage |
|-----------|----------|---------|-------------|
| App | 1234 | 5000 | 24.7% |
| Auth | 89 | 5000 | 1.8% |
| API | 456 | 5000 | 9.1% |




