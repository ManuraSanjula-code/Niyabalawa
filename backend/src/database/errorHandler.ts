import { DatabaseError } from 'pg';

export enum DatabaseErrorType {
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_LOST = 'CONNECTION_LOST',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  DATABASE_NOT_FOUND = 'DATABASE_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface DatabaseErrorInfo {
  type: DatabaseErrorType;
  message: string;
  isRetryable: boolean;
  httpStatus: number;
}

export class DatabaseErrorHandler {
  /**
   * Analyzes a database error and returns structured error information
   */
  static analyzeError(error: unknown): DatabaseErrorInfo {
    // Handle PostgreSQL specific errors
    if (error instanceof DatabaseError) {
      return this.analyzePostgresError(error);
    }

    // Handle generic connection errors
    const errorMessage = (error instanceof Error) ? error.message : String(error);

    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return {
        type: DatabaseErrorType.CONNECTION_TIMEOUT,
        message: 'Database connection timed out. Please try again.',
        isRetryable: true,
        httpStatus: 503
      };
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection refused')) {
      return {
        type: DatabaseErrorType.CONNECTION_REFUSED,
        message: 'Database connection refused. Please check database availability.',
        isRetryable: true,
        httpStatus: 503
      };
    }

    if (errorMessage.includes('connection terminated') || errorMessage.includes('connection lost')) {
      return {
        type: DatabaseErrorType.CONNECTION_LOST,
        message: 'Database connection was lost. Please try again.',
        isRetryable: true,
        httpStatus: 503
      };
    }

    // Default unknown error
    return {
      type: DatabaseErrorType.UNKNOWN_ERROR,
      message: 'An unexpected database error occurred.',
      isRetryable: false,
      httpStatus: 500
    };
  }

  /**
   * Analyzes PostgreSQL specific errors
   */
  private static analyzePostgresError(error: DatabaseError): DatabaseErrorInfo {
    const code = error.code;
    const message = error.message;

    switch (code) {
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
        return {
          type: DatabaseErrorType.CONNECTION_REFUSED,
          message: 'Database server is not reachable.',
          isRetryable: true,
          httpStatus: 503
        };

      case '42P01': // undefined_table
        return {
          type: DatabaseErrorType.DATABASE_NOT_FOUND,
          message: 'Database table not found. Please check database setup.',
          isRetryable: false,
          httpStatus: 500
        };

      case '23505': // unique_violation
        return {
          type: DatabaseErrorType.UNKNOWN_ERROR,
          message: 'Data conflict: This operation would create a duplicate record.',
          isRetryable: false,
          httpStatus: 409
        };

      case '23503': // foreign_key_violation
        return {
          type: DatabaseErrorType.UNKNOWN_ERROR,
          message: 'Data integrity error: Referenced record does not exist.',
          isRetryable: false,
          httpStatus: 400
        };

      default:
        // Check for timeout-related messages
        if (message.includes('timeout') || message.includes('Connection terminated')) {
          return {
            type: DatabaseErrorType.CONNECTION_TIMEOUT,
            message: 'Database operation timed out. Please try again.',
            isRetryable: true,
            httpStatus: 503
          };
        }

        // Check for connection lost
        if (message.includes('connection terminated') || message.includes('connection lost')) {
          return {
            type: DatabaseErrorType.CONNECTION_LOST,
            message: 'Database connection was lost during operation.',
            isRetryable: true,
            httpStatus: 503
          };
        }

        return {
          type: DatabaseErrorType.UNKNOWN_ERROR,
          message: 'A database error occurred.',
          isRetryable: false,
          httpStatus: 500
        };
    }
  }

  /**
   * Creates a standardized API response for database errors
   */
  static createErrorResponse(error: unknown, includeDetails: boolean = false) {
    const errorInfo = this.analyzeError(error);

    const response: Record<string, unknown> = {
      error: errorInfo.message,
      type: errorInfo.type,
      retryable: errorInfo.isRetryable
    };

    if (includeDetails && process.env.NODE_ENV === 'development') {
      response.details = (error instanceof Error) ? error.message : String(error);
      response.stack = (error instanceof Error) ? error.stack : undefined;
    }

    return {
      status: errorInfo.httpStatus,
      response
    };
  }

  /**
   * Middleware function for Express routes to handle database errors
   */
  static handleRouteError(error: unknown, operation: string) {
    const errorInfo = this.analyzeError(error);
    console.error(`❌ Database error in ${operation}:`, {
      type: errorInfo.type,
      message: (error instanceof Error) ? error.message : String(error),
      retryable: errorInfo.isRetryable
    });

    return this.createErrorResponse(error);
  }
}