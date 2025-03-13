/**
 * Security middleware configuration and implementation
 * إعدادات وتنفيذ وحدة الأمان
 */
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { TOKEN_BLACKLIST, RATE_LIMITS } from '../config/constants.js';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp'
];

// تحسين إعدادات محدد معدل الطلبات مع دعم القائمة السوداء
const createRateLimiter = (windowMs, max, keyGenerator) => rateLimit({
  windowMs,
  max,
  keyGenerator: keyGenerator || ((req) => req.ip),
  skip: (req) => req.path === '/health',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests - طلبات كثيرة جداً',
      message: 'Please try again later - يرجى المحاولة لاحقاً',
      retryAfter: Math.ceil(windowMs / 1000),
    });
  }
});

// إعدادات رؤوس الأمان المحسنة
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
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      workerSrc: ["'self'", 'blob:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// إعدادات CORS المحسنة
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// مصفوفة وحدات الأمان المحسنة
export const securityMiddleware = [
  // تطبيق حد معدل الطلبات العام
  createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  ),
  
  // حد معدل طلبات خاص لمحاولات تسجيل الدخول
  createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    5, // 5 attempts
    (req) => req.path.includes('/login') ? req.ip : null
  ),
  
  // تطبيق رؤوس الأمان
  securityHeaders,
  
  // تطبيق إعدادات CORS
  cors(corsOptions),

  // التحقق من التوكن في القائمة السوداء
  async (req, res, next) => {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (token && TOKEN_BLACKLIST.has(token)) {
      return res.status(401).json({
        error: 'Invalid token - رمز غير صالح',
        message: 'Please log in again - يرجى تسجيل الدخول مرة أخرى'
      });
    }
    next();
  },
  
  // منع محتوى مشبوه
  (req, res, next) => {
    const contentType = req.headers['content-type'];
    if (req.method === 'POST' && contentType?.includes('multipart/form-data')) {
      const fileTypes = req.files?.map(f => f.mimetype);
      if (fileTypes?.some(type => !ALLOWED_FILE_TYPES.includes(type))) {
        return res.status(400).json({
          error: 'Invalid file type - نوع ملف غير صالح',
          message: 'Only images and PDFs are allowed - يسمح فقط بالصور وملفات PDF'
        });
      }
    }
    next();
  },
  
  // إضافة معرف فريد للطلب
  (req, res, next) => {
    req.id = crypto.randomUUID();
    next();
  }
];

// تصدير الوظائف المساعدة للاستخدام في أماكن أخرى
export const security = {
  createRateLimiter,
  corsOptions,
  securityHeaders
};
