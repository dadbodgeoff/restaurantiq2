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
    console.log('🔧 LoggerService constructor called');

    try {
      console.log('🔍 Getting environment config...');
      const config = getEnvConfig();
      console.log('✅ Environment config loaded:', {
        LOG_LEVEL: config.LOG_LEVEL,
        LOG_FORMAT: config.LOG_FORMAT
      });

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

      console.log('✅ LoggerService initialized successfully');
    } catch (error) {
      console.error('🚨 LoggerService initialization failed:', error);
      console.error('🚨 Error details:', error instanceof Error ? error.message : String(error));
      // Fallback to basic console logger
      this.logger = pino({
        level: 'info',
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      });
      console.log('⚠️ Using fallback logger');
    }
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
