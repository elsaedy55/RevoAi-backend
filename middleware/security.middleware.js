/**
 * Security middleware configuration and implementation
 * إعدادات وتنفيذ وحدة الأمان
 * @module middleware/security
 */
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

/**
 * Rate limiter configuration
 * إعدادات محدد معدل الطلبات
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes by default - 15 دقيقة كقيمة افتراضية
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP - تحديد كل عنوان IP
  message: {
    error: 'Too many requests - طلبات كثيرة جداً',
    message: 'Please try again later - يرجى المحاولة لاحقاً',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Security headers configuration using Helmet
 * إعدادات رؤوس الأمان باستخدام Helmet
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.gstatic.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://firestore.googleapis.com', 'https://*.firebaseio.com'],
      frameSrc: ["'self'", 'https://*.firebaseapp.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Firebase Auth - مطلوب لمصادقة Firebase
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Required for Firebase Storage - مطلوب لتخزين Firebase
});

/**
 * CORS configuration
 * إعدادات CORS
 */
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  maxAge: 86400, // 24 hours - 24 ساعة
};

/**
 * Combined security middleware array
 * مصفوفة وحدات الأمان المجمعة
 */
export const securityMiddleware = [
  // Apply rate limiting - تطبيق حد معدل الطلبات
  limiter,
  // Apply security headers - تطبيق رؤوس الأمان
  securityHeaders,
  // Apply CORS configuration - تطبيق إعدادات CORS
  cors(corsOptions),
];
