/**
 * Logger Configuration
 * Structured logging for the Alkemio MCP Server
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  tool?: string;
  operation?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class Logger {
  private level: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatEntry('debug', message, context);
      this.addLog(entry);
      console.log(`[DEBUG] ${entry.timestamp}: ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const entry = this.formatEntry('info', message, context);
      this.addLog(entry);
      console.log(`[INFO] ${entry.timestamp}: ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatEntry('warn', message, context);
      this.addLog(entry);
      console.warn(`[WARN] ${entry.timestamp}: ${message}`, context ? JSON.stringify(context) : '');
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const entry = this.formatEntry('error', message, {
        ...context,
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
      this.addLog(entry);
      console.error(`[ERROR] ${entry.timestamp}: ${message}`, error, context ? JSON.stringify(context) : '');
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// Singleton instance
export const logger = new Logger();

// Helper for MCP tool execution logging
export function logToolExecution(toolName: string, operation: string, context?: LogContext): void {
  logger.info(`Executing tool: ${toolName}`, { tool: toolName, operation, ...context });
}

// Helper for GraphQL operation logging
export function logGraphQLOperation(operation: string, query?: string, variables?: Record<string, unknown>): void {
  logger.debug(`GraphQL operation: ${operation}`, { operation, queryLength: query?.length, variablesKeys: variables ? Object.keys(variables) : undefined });
}