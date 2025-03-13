/**
 * Enhanced logging utility with multilingual support
 * أداة تسجيل محسنة مع دعم تعدد اللغات
 * @module utils/logger
 */

/**
 * Log levels in order of severity
 * مستويات التسجيل حسب الأهمية
 */
const LOG_LEVELS = {
  DEBUG: 'DEBUG',   // Detailed debugging - تصحيح مفصل
  INFO: 'INFO',     // General information - معلومات عامة
  WARN: 'WARN',     // Warnings - تحذيرات
  ERROR: 'ERROR',   // Errors - أخطاء
};

/**
 * Logger class with multilingual support
 * فئة التسجيل مع دعم تعدد اللغات
 */
class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || LOG_LEVELS.INFO;
  }

  /**
   * Format log message with metadata
   * تنسيق رسالة السجل مع البيانات الوصفية
   * @param {string} level - Log level - مستوى السجل
   * @param {string} message - Log message - رسالة السجل
   * @param {Object} [metadata] - Additional metadata - بيانات وصفية إضافية
   * @returns {string} Formatted log message - رسالة السجل المنسقة
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const metadataStr = Object.keys(metadata).length
      ? `\n${JSON.stringify(metadata, null, 2)}`
      : '';

    return `[${timestamp}] [${level}] ${message}${metadataStr}`;
  }

  /**
   * Log debug message
   * تسجيل رسالة تصحيح
   * @param {string} message - Debug message - رسالة التصحيح
   * @param {Object} [metadata] - Additional metadata - بيانات وصفية إضافية
   */
  debug(message, metadata) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      process.stdout.write(`${this.formatMessage(LOG_LEVELS.DEBUG, message, metadata)}\n`);
    }
  }

  /**
   * Log info message
   * تسجيل رسالة معلومات
   * @param {string} message - Info message - رسالة المعلومات
   * @param {Object} [metadata] - Additional metadata - بيانات وصفية إضافية
   */
  info(message, metadata) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      process.stdout.write(`${this.formatMessage(LOG_LEVELS.INFO, message, metadata)}\n`);
    }
  }

  /**
   * Log warning message
   * تسجيل رسالة تحذير
   * @param {string} message - Warning message - رسالة التحذير
   * @param {Object} [metadata] - Additional metadata - بيانات وصفية إضافية
   */
  warn(message, metadata) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      process.stderr.write(`${this.formatMessage(LOG_LEVELS.WARN, message, metadata)}\n`);
    }
  }

  /**
   * Log error message with stack trace
   * تسجيل رسالة خطأ مع تتبع المكدس
   * @param {string} message - Error message - رسالة الخطأ
   * @param {Error} [error] - Error object - كائن الخطأ
   * @param {Object} [metadata] - Additional metadata - بيانات وصفية إضافية
   */
  error(message, error, metadata = {}) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      const errorMetadata = error
        ? {
            ...metadata,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
              ...(error.code && { code: error.code }),
            },
          }
        : metadata;

      process.stderr.write(`${this.formatMessage(LOG_LEVELS.ERROR, message, errorMetadata)}\n`);
    }
  }

  /**
   * Check if message should be logged at current log level
   * التحقق مما إذا كان يجب تسجيل الرسالة في المستوى الحالي
   * @param {string} messageLevel - Message log level - مستوى تسجيل الرسالة
   * @returns {boolean} Whether message should be logged - ما إذا كان يجب تسجيل الرسالة
   */
  shouldLog(messageLevel) {
    const levels = Object.values(LOG_LEVELS);
    return levels.indexOf(messageLevel) >= levels.indexOf(this.logLevel);
  }

  /**
   * Set current log level
   * تعيين مستوى التسجيل الحالي
   * @param {string} level - New log level - مستوى التسجيل الجديد
   * @throws {Error} If level is invalid - إذا كان المستوى غير صالح
   */
  setLogLevel(level) {
    if (!Object.values(LOG_LEVELS).includes(level)) {
      throw new Error(`Invalid log level: ${level} - مستوى تسجيل غير صالح`);
    }
    this.logLevel = level;
  }
}

// Create and export singleton instance - إنشاء وتصدير نسخة وحيدة
export const logger = new Logger();
