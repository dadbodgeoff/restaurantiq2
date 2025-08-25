export interface LogContext {
  correlationId?: string;
  userId?: string;
  restaurantId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  operation: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class LoggerService {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(operation: string, message: string, context?: LogContext): void {
    this.log('debug', operation, message, context);
  }

  info(operation: string, message: string, context?: LogContext): void {
    this.log('info', operation, message, context);
  }

  warn(operation: string, message: string, context?: LogContext): void {
    this.log('warn', operation, message, context);
  }

  error(operation: string, error: Error, context?: LogContext): void {
    this.log('error', operation, error.message, context, error);
  }

  private log(
    level: LogEntry['level'],
    operation: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      operation,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    if (this.isDevelopment) {
      this.logToConsole(entry);
    } else {
      // In production, you might want to send logs to a service
      this.logToService(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { level, operation, message, context, error } = entry;

    const logData = {
      operation,
      message,
      context,
      ...(error && { error }),
    };

    switch (level) {
      case 'debug':
        console.debug(`[${entry.timestamp.toISOString()}] DEBUG:`, logData);
        break;
      case 'info':
        console.info(`[${entry.timestamp.toISOString()}] INFO:`, logData);
        break;
      case 'warn':
        console.warn(`[${entry.timestamp.toISOString()}] WARN:`, logData);
        break;
      case 'error':
        console.error(`[${entry.timestamp.toISOString()}] ERROR:`, logData);
        break;
    }
  }

  private logToService(entry: LogEntry): void {
    // Implement your production logging service here
    // For example: send to DataDog, CloudWatch, etc.
    console.log('Production log:', entry);
  }
}
