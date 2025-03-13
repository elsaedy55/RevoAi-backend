/**
 * Application constants and configuration values
 * ثوابت وقيم إعدادات التطبيق
 * @module config/constants
 */

/**
 * HTTP Status codes used in responses
 * رموز حالة HTTP المستخدمة في الردود
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Authentication and security settings
 * إعدادات المصادقة والأمان
 */
export const AUTH = {
  TOKEN_EXPIRY: '1h', // Token expiry time - وقت انتهاء صلاحية الرمز
  REFRESH_TOKEN_EXPIRY: '7d', // Refresh token expiry - وقت انتهاء صلاحية رمز التحديث
  PASSWORD_MIN_LENGTH: 8, // Minimum password length - الحد الأدنى لطول كلمة المرور
  PASSWORD_PATTERN: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, // Password pattern - نمط كلمة المرور
  MAX_LOGIN_ATTEMPTS: 5, // Maximum login attempts - الحد الأقصى لمحاولات تسجيل الدخول
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes lockout - مدة القفل 15 دقيقة
};

/**
 * User roles and status definitions
 * تعريفات أدوار وحالات المستخدمين 
 */
export const USER = {
  ROLES: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    ADMIN: 'admin',
  },
  STATUS: {
    ACTIVE: 'active',
    PENDING: 'pending',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive',
  },
};

/**
 * Firestore collection names
 * أسماء مجموعات Firestore
 */
export const COLLECTIONS = {
  USERS: 'users',
  PATIENTS: 'patients',
  DOCTORS: 'doctors',
  PERMISSIONS: 'permissions',
  MEDICAL_RECORDS: 'medicalRecords',
  ACCESS_REQUESTS: 'accessRequests',
  NOTIFICATIONS: 'notifications',
};

/**
 * Notification types and priorities
 * أنواع وأولويات الإشعارات
 */
export const NOTIFICATION = {
  TYPES: {
    DIAGNOSIS_UPDATE: 'DIAGNOSIS_UPDATE',
    PERMISSION_GRANTED: 'PERMISSION_GRANTED',
    PERMISSION_REVOKED: 'PERMISSION_REVOKED',
    ACCESS_REQUEST: 'ACCESS_REQUEST',
  },
  PRIORITIES: {
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low',
  },
};

/**
 * Input validation rules and limits
 * قواعد وحدود التحقق من المدخلات
 */
export const VALIDATION = {
  NAME: {
    MIN_LENGTH: 3, // Minimum name length - الحد الأدنى لطول الاسم
    MAX_LENGTH: 50, // Maximum name length - الحد الأقصى لطول الاسم
  },
  AGE: {
    MIN: 0,
    MAX: 120,
  },
  GENDER: ['male', 'female'],
  EXPERIENCE: {
    MIN: 0,
    MAX: 70, // Maximum years of experience - الحد الأقصى لسنوات الخبرة
  },
  LICENSE: {
    MIN_LENGTH: 5, // Minimum license number length - الحد الأدنى لطول رقم الرخصة
    PATTERN: /^[A-Z0-9-]+$/i, // License number pattern - نمط رقم الرخصة
  },
  FILE: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB maximum file size - الحد الأقصى لحجم الملف
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
    MAX_COUNT: 10, // Maximum number of files - الحد الأقصى لعدد الملفات
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },
};

/**
 * Error messages in English and Arabic
 * رسائل الخطأ باللغتين الإنجليزية والعربية
 */
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password - بيانات الدخول غير صحيحة',
    ACCOUNT_LOCKED: 'Account is temporarily locked - الحساب مغلق مؤقتاً',
    TOKEN_EXPIRED: 'Authentication token expired - انتهت صلاحية رمز المصادقة',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions - صلاحيات غير كافية',
  },
  USER: {
    NOT_FOUND: 'User not found - المستخدم غير موجود',
    ALREADY_EXISTS: 'User already exists - المستخدم موجود بالفعل',
    INVALID_STATUS: 'Invalid user status - حالة المستخدم غير صالحة',
  },
  VALIDATION: {
    INVALID_INPUT: 'Invalid input data - البيانات المدخلة غير صالحة',
    REQUIRED_FIELD: 'Field is required - الحقل مطلوب',
    INVALID_FORMAT: 'Invalid format - التنسيق غير صالح',
  },
};

/**
 * Cache configuration settings
 * إعدادات التخزين المؤقت
 */
export const CACHE = {
  TTL: {
    SHORT: 60 * 1000, // 1 minute - دقيقة واحدة
    MEDIUM: 5 * 60 * 1000, // 5 minutes - 5 دقائق
    LONG: 30 * 60 * 1000, // 30 minutes - 30 دقيقة
  },
  KEYS: {
    USER_PROFILE: 'user_profile:',
    DOCTOR_LIST: 'doctor_list',
    PATIENT_LIST: 'patient_list',
  },
};
