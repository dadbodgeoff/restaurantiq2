import { PrismaClient } from '@prisma/client';

/**
 * Base Repository Pattern - Enterprise Standard
 *
 * Provides consistent error handling, logging, and validation patterns
 * across all repository implementations.
 */
export abstract class BaseRepository {
  protected constructor(protected readonly prisma: PrismaClient) {}

  /**
   * Execute database operation with consistent error handling
   */
  protected async executeQuery<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ ${this.constructor.name}.${operationName} failed:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Validate required string parameters
   */
  protected validateRequiredString(value: string, fieldName: string): void {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} is required and must be a non-empty string`);
    }
  }

  /**
   * Validate UUID format
   */
  protected validateId(id: string, entityName: string): void {
    this.validateRequiredString(id, `${entityName} ID`);

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error(`Invalid ${entityName} ID format`);
    }
  }

  /**
   * Safely handle optional fields in Prisma responses
   */
  protected safeOptional<T>(value: T | null | undefined): T | undefined {
    return value ?? undefined;
  }

  /**
   * Standard logging for repository operations
   */
  protected logOperation(operation: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${this.constructor.name}.${operation}`, data || '');
    }
  }
}
