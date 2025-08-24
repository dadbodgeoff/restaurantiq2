import { LoggerService } from '../../logging/logger.service';
import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission } from '../../../domains/shared/types/permissions';

/**
 * Enterprise-grade request logger middleware.
 * - Uses DI container for logger resolution.
 * - Strict type safety, robust error handling, and zero technical debt.
 * - Logs both request and response with correlation and user context.
 * - No manual instantiation, and full observability.
 * - Uses type guards for extended request properties to avoid interface extension issues.
 */

// Extended request properties with proper typing
interface ExtendedRequestProperties {
  container?: {
    resolve: (service: string) => unknown;
  };
  correlationId?: string;
  user?: {
    id: string;
    restaurantId: string;
    role: UserRole;
    permissions: Permission[];
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

// Type guards for extended properties with proper typing
const hasContainer = (r: Request): r is Request & Required<Pick<ExtendedRequestProperties, 'container'>> =>
  typeof (r as Request & ExtendedRequestProperties).container?.resolve === 'function';

const hasCorrelationId = (r: Request): r is Request & Required<Pick<ExtendedRequestProperties, 'correlationId'>> =>
  typeof (r as Request & ExtendedRequestProperties).correlationId === 'string';

const hasUser = (r: Request): r is Request & Required<Pick<ExtendedRequestProperties, 'user'>> => {
  const extendedReq = r as Request & ExtendedRequestProperties;
  return (
    typeof extendedReq.user === 'object' &&
    extendedReq.user !== null &&
    typeof extendedReq.user.id === 'string' &&
    typeof extendedReq.user.restaurantId === 'string' &&
    typeof extendedReq.user.role === 'string' &&
    Array.isArray(extendedReq.user.permissions)
  );
};

export const requestLogger = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    let logger: LoggerService | undefined;
    if (hasContainer(req)) {
      try {
        const resolved = req.container.resolve('loggerService');
        if (resolved instanceof LoggerService) {
          logger = resolved;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          '[RequestLogger] Error resolving LoggerService from DI container:',
          err
        );
      }
    }

    // Gather context for logging
    const correlationId = hasCorrelationId(req) ? req.correlationId : undefined;
    const userId = hasUser(req) ? req.user?.id : undefined;
    const restaurantId = hasUser(req) ? req.user?.restaurantId : undefined;

    logger?.info('HTTP Request', 'Request received', {
      correlationId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId,
      restaurantId,
      userAgent: req.get('User-Agent'),
    });

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger?.info('HTTP Response', 'Request completed', {
        correlationId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId,
        restaurantId,
      });
    });

    next();
  };
};