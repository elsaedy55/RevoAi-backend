/**
 * Global error handling middleware and custom error types
 * وحدة معالجة الأخطاء العامة وأنواع الأخطاء المخصصة
 * @module middleware/error
 */
import { HTTP_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/validation.js';

/**
 * Base application error class
 * فئة الخطأ الأساسية في التطبيق
 */
export class ApplicationError extends Error {
  constructor(message, status = HTTP_STATUS.INTERNAL_ERROR, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
    };
  }
}

/**
 * Resource not found error
 * خطأ: المورد غير موجود 
 */
export class NotFoundError extends ApplicationError {
  constructor(resource = 'Resource') {
    super(`${resource} not found - غير موجود`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

/**
 * Unauthorized access error
 * خطأ: وصول غير مصرح به
 */
export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized access - غير مصرح به') {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden access error
 * خطأ: وصول ممنوع
 */
export class ForbiddenError extends ApplicationError {
  constructor(message = 'Access forbidden - ممنوع الوصول') {
    super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }
}

/**
 * Resource conflict error
 * خطأ: تعارض في الموارد
 */
export class ConflictError extends ApplicationError {
  constructor(message) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}

/**
 * Bad request error
 * خطأ: طلب غير صالح
 */
export class BadRequestError extends ApplicationError {
  constructor(message) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST');
  }
}

/**
 * Firebase-specific error wrapper
 * معالج أخطاء Firebase المخصص
 */
export class FirebaseError extends ApplicationError {
  constructor(error) {
    super(error.message, HTTP_STATUS.INTERNAL_ERROR, error.code || 'FIREBASE_ERROR');
    this.originalError = error;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      originalError: this.originalError,
    };
  }
}

/**
 * Global error handling middleware
 * وحدة معالجة الأخطاء العامة
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} _next - Next middleware function
 */
export const errorHandler = (err, req, res, _next) => {
  // Log error details with request context
  const errorContext = {
    url: req.originalUrl,
    method: req.method,
    requestId: req.id,
    userId: req.user?.uid,
    ...(process.env.NODE_ENV === 'development' && { body: req.body }),
  };

  logger.error('Error occurred:', err, errorContext);

  // Handle validation errors
  if (err instanceof ValidationError) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation Error - خطأ في التحقق',
      details: err.errors,
      code: 'VALIDATION_ERROR',
    });
  }

  // Handle known application errors
  if (err instanceof ApplicationError) {
    return res.status(err.status).json(err.toJSON());
  }

  // Handle Firebase Auth errors
  if (err.code?.startsWith('auth/')) {
    const firebaseError = new FirebaseError(err);
    return res.status(HTTP_STATUS.UNAUTHORIZED).json(firebaseError.toJSON());
  }

  // Default error response
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    error: 'Internal Server Error - خطأ في الخادم',
    message: isProduction ? 'An unexpected error occurred - حدث خطأ غير متوقع' : err.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
