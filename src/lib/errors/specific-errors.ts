import { BaseApplicationError, ErrorCategory } from './application-error';

// Validation Errors (400)
export class ValidationError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.VALIDATION,
      'VALIDATION_ERROR',
      400,
      message,
      correlationId,
      context
    );
  }
}

// Authentication Errors (401)
export class AuthenticationError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.AUTHENTICATION,
      'AUTHENTICATION_ERROR',
      401,
      message,
      correlationId,
      context
    );
  }
}

// Authorization Errors (403)
export class AuthorizationError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.AUTHORIZATION,
      'AUTHORIZATION_ERROR',
      403,
      message,
      correlationId,
      context
    );
  }
}

// Not Found Errors (404)
export class RestaurantNotFoundError extends BaseApplicationError {
  constructor(restaurantId: string, correlationId: string) {
    super(
      ErrorCategory.NOT_FOUND,
      'RESTAURANT_NOT_FOUND',
      404,
      `Restaurant with ID ${restaurantId} not found`,
      correlationId,
      { restaurantId }
    );
  }
}

export class UserNotFoundError extends BaseApplicationError {
  constructor(userId: string, correlationId: string) {
    super(
      ErrorCategory.NOT_FOUND,
      'USER_NOT_FOUND',
      404,
      `User with ID ${userId} not found`,
      correlationId,
      { userId }
    );
  }
}

export class MenuItemNotFoundError extends BaseApplicationError {
  constructor(menuItemId: string, correlationId: string) {
    super(
      ErrorCategory.NOT_FOUND,
      'MENU_ITEM_NOT_FOUND',
      404,
      `Menu item with ID ${menuItemId} not found`,
      correlationId,
      { menuItemId }
    );
  }
}

// Conflict Errors (409)
export class ConflictError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.CONFLICT,
      'CONFLICT_ERROR',
      409,
      message,
      correlationId,
      context
    );
  }
}

// Business Logic Errors (422)
export class BusinessRuleError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.BUSINESS,
      'BUSINESS_RULE_VIOLATION',
      422,
      message,
      correlationId,
      context
    );
  }
}

// External Service Errors (502)
export class ExternalServiceError extends BaseApplicationError {
  constructor(serviceName: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.EXTERNAL,
      'EXTERNAL_SERVICE_ERROR',
      502,
      `${serviceName} service is unavailable`,
      correlationId,
      { serviceName, ...context }
    );
  }
}

// Internal Errors (500)
export class DatabaseError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.INTERNAL,
      'DATABASE_ERROR',
      500,
      message,
      correlationId,
      context
    );
  }
}

export class InternalServerError extends BaseApplicationError {
  constructor(message: string, correlationId: string, context?: any) {
    super(
      ErrorCategory.INTERNAL,
      'INTERNAL_SERVER_ERROR',
      500,
      message,
      correlationId,
      context
    );
  }
}
