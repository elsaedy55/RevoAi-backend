/**
 * Environment configuration with enhanced security and performance options
 * @module config/env
 */
import dotenv from 'dotenv';
import crypto from 'crypto';

// تحميل متغيرات البيئة
dotenv.config();

// المتغيرات البيئية المطلوبة
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'JWT_SECRET'
];

// التحقق من المتغيرات البيئية المطلوبة
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// إنشاء مفتاح تشفير عشوائي إذا لم يتم توفيره
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',

  FIREBASE: {
    API_KEY: process.env.FIREBASE_API_KEY,
    AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    APP_ID: process.env.FIREBASE_APP_ID,
  },

  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || generateEncryptionKey(),
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    PASSWORD_POLICY: {
      MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SYMBOLS: true
    },
    SESSION: {
      MAX_SESSIONS: parseInt(process.env.MAX_SESSIONS, 10) || 5,
      EXTEND_ON_ACCESS: process.env.EXTEND_SESSION === 'true',
    },
    RATE_LIMIT: {
      WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
      MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
      LOGIN_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
      LOGIN_MAX_ATTEMPTS: 5,
    },
  },

  CACHE: {
    ENABLED: process.env.CACHE_ENABLED === 'true',
    TTL: {
      DEFAULT: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes
      USER: parseInt(process.env.USER_CACHE_TTL, 10) || 600, // 10 minutes
      MEDICAL_RECORD: parseInt(process.env.MEDICAL_RECORD_CACHE_TTL, 10) || 1800, // 30 minutes
    },
    MAX_SIZE: parseInt(process.env.CACHE_MAX_SIZE, 10) || 1000, // أقصى عدد للعناصر المخزنة مؤقتاً
  },

  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || 'info',
    FILE_ENABLED: process.env.LOG_TO_FILE === 'true',
    FILE_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',
    MAX_FILES: parseInt(process.env.LOG_MAX_FILES, 10) || 5,
    MAX_SIZE: parseInt(process.env.LOG_MAX_SIZE, 10) || 10 * 1024 * 1024, // 10MB
    SANITIZE_FIELDS: ['password', 'token', 'apiKey'],
  },

  CORS: {
    ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['*'],
    METHODS: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
    EXPOSED_HEADERS: ['Content-Range', 'X-Content-Range'],
    CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
    MAX_AGE: parseInt(process.env.CORS_MAX_AGE, 10) || 86400,
  },

  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf'
    ],
    SCAN_FOR_MALWARE: process.env.SCAN_UPLOADS === 'true',
    STORAGE_PATH: process.env.UPLOAD_STORAGE_PATH || 'uploads/',
  },

  NOTIFICATIONS: {
    FCM_ENABLED: process.env.FCM_ENABLED === 'true',
    EMAIL_ENABLED: process.env.EMAIL_NOTIFICATIONS === 'true',
    SMS_ENABLED: process.env.SMS_NOTIFICATIONS === 'true',
    BATCH_SIZE: parseInt(process.env.NOTIFICATION_BATCH_SIZE, 10) || 100,
    RETRY_ATTEMPTS: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS, 10) || 3,
  },

  PERFORMANCE: {
    QUERY_LIMIT: parseInt(process.env.DEFAULT_QUERY_LIMIT, 10) || 50,
    PAGINATION_MAX_SIZE: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
    COMPRESSION_ENABLED: process.env.COMPRESSION_ENABLED !== 'false',
    OPTIMIZATION_LEVEL: process.env.OPTIMIZATION_LEVEL || 'balanced',
  }
};

// التحقق من إعدادات الأمان الحساسة
if (ENV.IS_PRODUCTION) {
  if (ENV.SECURITY.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  if (ENV.SECURITY.BCRYPT_ROUNDS < 12) {
    throw new Error('BCRYPT_ROUNDS should be at least 12 in production');
  }
}
