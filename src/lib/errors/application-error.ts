export enum ErrorCategory {
  VALIDATION = 'VALIDATION',       // 400 - Bad Request
  AUTHENTICATION = 'AUTH',         // 401 - Unauthorized
  AUTHORIZATION = 'FORBIDDEN',      // 403 - Forbidden
  NOT_FOUND = 'NOT_FOUND',         // 404 - Not Found
  CONFLICT = 'CONFLICT',           // 409 - Conflict
  BUSINESS = 'BUSINESS',           // 422 - Unprocessable Entity
  EXTERNAL = 'EXTERNAL',           // 502 - Bad Gateway
  INTERNAL = 'INTERNAL'            // 500 - Internal Server Error
}

export interface ApplicationError extends Error {
  category: ErrorCategory;
  code: string;
  httpStatus: number;
  correlationId: string;
  context?: Record<string, any>;
  isOperational: boolean;
}

export abstract class BaseApplicationError extends Error implements ApplicationError {
  public readonly isOperational: boolean = true;
  public readonly correlationId: string;
  public readonly context?: Record<string, any>;

  constructor(
    public readonly category: ErrorCategory,
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
    correlationId: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.correlationId = correlationId;
    this.context = context ?? {};

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
