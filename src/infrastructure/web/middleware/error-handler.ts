import { Request, Response, NextFunction } from 'express';
import { ApplicationError, ErrorCategory } from '../../../lib/errors/application-error';
import { LoggerService } from '../../logging/logger.service';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = req.correlationId || 'unknown';
  const logger = req.container?.resolve('loggerService') as LoggerService;

  // Log the error
  if (logger) {
    logger.error('Request Error', error, {
      correlationId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      restaurantId: req.user?.restaurantId,
    });
  }

  // Handle Application Errors
  if ('category' in error && 'correlationId' in error && 'httpStatus' in error) {
    const appError = error as ApplicationError;
    const response: any = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        correlationId: appError.correlationId,
      },
    };

    // Add additional context in development
    if (process.env.NODE_ENV === 'development') {
      response.error.context = appError.context;
    }

    res.status(appError.httpStatus).json(response);
    return;
  }

  // Handle Prisma Errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        res.status(409).json({
          success: false,
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: 'A record with this information already exists',
            correlationId,
          },
        });
        return;

      case 'P2025': // Record not found
        res.status(404).json({
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'The requested record was not found',
            correlationId,
          },
        });
        return;

      default:
        res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'A database error occurred',
            correlationId,
          },
        });
        return;
    }
  }

  // Handle Validation Errors (Zod)
  if (error.name === 'ZodError') {
    const zodError = error as any;
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: zodError.errors,
        correlationId,
      },
    });
    return;
  }

  // Handle JWT Errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        correlationId,
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      correlationId,
    },
  });
}
