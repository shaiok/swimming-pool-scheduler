
import { Response, Request, NextFunction } from 'express';


export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  
  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, true);
  }
}




export const errorHandler = (error: any, res: Response) => {
  // If it's one of our custom errors, use its statusCode
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: error.isOperational ? error.message : 'An error occurred',
    });
  }
  
  // Check for specific error messages for swimming styles
  if (error.message && error.message.includes('אינו מתאמן בסגנון')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errorType: 'SWIMMING_STYLE_MISMATCH',
    });
  }
  
  // Default to 500 for unhandled errors
  console.error('Unhandled error:', error);
  return res.status(500).json({
    success: false,
    message: 'לא ניתן לקבוע שיעור',
    error: 'Internal server error',
  });
};

// Express middleware version
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, res);
};