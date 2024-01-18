type LogEntry = {
    messages: any[];
    timestamp: Date;
    namespace: string;
    logtype?: string;
  };
  
  type Criteria = boolean | ((logEntry: LogEntry) => boolean);
  
  interface KonsolePublic {
    viewLogs(batchSize?: number): void;
  }
  
  class Konsole implements KonsolePublic {
    private static instances: Map<string, Konsole> = new Map();
  
    private logs: LogEntry[] = [];
  
    private windowFlagName: string;
  
    private namespace: string;
  
    private criteria: Criteria = false;
  
    private defaultBatchSize: number = 100;
  
    private currentBatchStart: number = 0;
  
    constructor(namespace: string = 'Global', criteria: Criteria = false) {
      this.windowFlagName = '__KonsolePrintEnabled__';
      setInterval(() => this.flushOldLogs(), 3600000); // Check every hour
      this.initWindowFlag();
      this.namespace = namespace;
      this.criteria = criteria;
      Konsole.instances.set(namespace, this);
    }
  
    static exposeToWindow(): void {
      // eslint-disable-next-line no-underscore-dangle
      (window as any).__Konsole = {
        getLogger: (namespace: string = 'Global'): KonsolePublic => {
          const logger = Konsole.getLogger(namespace);
          return {
            viewLogs: (batchSize?: number) => logger.viewLogs(batchSize)
            // Add other public methods here
          };
        }
      };
    }
  
    static getLogger(namespace: string = 'Global'): Konsole {
      if (!Konsole.instances.has(namespace)) {
        console.log('Instance not found');
      }
      return Konsole.instances.get(namespace)!;
    }
  
    setCriteria(criteria: Criteria): void {
      this.criteria = criteria;
    }
  
    log(...args: any[]): void {
      const namespace = this.getNamespace();
      const logEntry: LogEntry = {
        messages: args,
        timestamp: new Date(),
        namespace
      };
      this.logs.push(logEntry);
      this.processLog(logEntry);
    }
    
    error(...args: any[]): void {
      const namespace = this.getNamespace();
      const logEntry: LogEntry = {
        messages: args,
        timestamp: new Date(),
        namespace,
        logtype: 'error'
      };
      this.logs.push(logEntry);
      this.processLog(logEntry);
    }
  
    viewLogs(batchSize: number = this.defaultBatchSize): void {
      // Check if we're already at the end of the logs
      if (this.currentBatchStart >= this.logs.length) {
        console.log('No more logs.');
        return;
      }
  
      // Calculate the end index for the current batch
      const batchEnd = Math.min(
        this.currentBatchStart + batchSize,
        this.logs.length
      );
  
      // Get the current batch of logs
      const batch = this.logs.slice(this.currentBatchStart, batchEnd);
  
      // Display the current batch of logs
      console.table(batch);
  
      // Update the start index for the next batch
      this.currentBatchStart = batchEnd;
  
      // Check if we've reached the end of the logs
      if (this.currentBatchStart >= this.logs.length) {
        console.log('No more logs.');
      }
    }
  
    private initWindowFlag(): void {
      (window as any)[this.windowFlagName] = false;
    }
  
    private getNamespace(): string {
      // For Browser based
      return this.namespace;
    }
  
    private processLog(logEntry: LogEntry): void {
      if ((window as any)[this.windowFlagName] || this.logCriteria(logEntry)) {
        if(logEntry.logtype === 'error') {
          console.error(...[logEntry.namespace, ...logEntry.messages]);
        } 
        else{
          console.table(...[logEntry.namespace, ...logEntry.messages]);
        }
      }
    }
  
    private logCriteria(logEntry: LogEntry): boolean {
      if (typeof this.criteria === 'boolean') {
        return this.criteria;
      }
      if (typeof this.criteria === 'function') {
        return this.criteria(logEntry);
      }
      return false;
    }
  
    private flushOldLogs(): void {
      const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
      this.logs = this.logs.filter((log) => log.timestamp > cutoffTime);
    }
  }
  
  Konsole.exposeToWindow();
  
  export default Konsole;
  