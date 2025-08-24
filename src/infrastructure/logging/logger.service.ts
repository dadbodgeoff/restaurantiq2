import pino from 'pino';
import { getEnvConfig } from '../../config/env';

export interface LogContext {
  correlationId: string;
  userId?: string | undefined;
  restaurantId?: string | undefined;
  operation?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    context?: any;
  };
  [key: string]: any;
}

export class LoggerService {
  private logger: pino.Logger;

  constructor() {
    const config = getEnvConfig();

    this.logger = pino({
      level: config.LOG_LEVEL,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      ...(config.LOG_FORMAT === 'dev' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }),
    });
  }

  info(operation: string, message: string, context?: Partial<LogContext>): void {
    this.logger.info({
      operation,
      message,
      ...context,
    });
  }

  error(operation: string, error: Error, context?: Partial<LogContext>): void {
    this.logger.error({
      operation,
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context?.error,
      },
      ...context,
    });
  }

  warn(operation: string, message: string, context?: Partial<LogContext>): void {
    this.logger.warn({
      operation,
      message,
      ...context,
    });
  }

  debug(operation: string, data: any, context?: Partial<LogContext>): void {
    this.logger.debug({
      operation,
      data,
      ...context,
    });
  }
}
