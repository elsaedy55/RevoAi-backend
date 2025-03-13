/**
 * نظام التحقق من صحة البيانات المحسن
 * @module utils/validation
 */
import { VALIDATION } from '../config/constants.js';
import { logger } from './logger.js';

export class ValidationError extends Error {
  constructor(errors, code = 'VALIDATION_ERROR') {
    super(Array.isArray(errors) ? errors.join(', ') : errors);
    this.name = 'ValidationError';
    this.errors = Array.isArray(errors) ? errors : [errors];
    this.code = code;
  }
}

// قواعد التحقق الأساسية المحسنة
const ValidationRules = {
  required: (value, fieldName) =>
    value?.toString().trim() ? null : `${fieldName} is required - ${fieldName} مطلوب`,

  minLength: min => (value, fieldName) =>
    value?.length >= min
      ? null
      : `${fieldName} must be at least ${min} characters - ${fieldName} يجب أن يكون على الأقل ${min} حروف`,

  maxLength: max => (value, fieldName) =>
    value?.length <= max
      ? null
      : `${fieldName} must be at most ${max} characters - ${fieldName} يجب أن يكون على الأكثر ${max} حروف`,

  numeric: (value, fieldName) =>
    /^\d+$/.test(value?.toString())
      ? null
      : `${fieldName} must be numeric - ${fieldName} يجب أن يكون رقمياً`,

  email: (value, fieldName) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? null
      : `${fieldName}: Invalid email format - تنسيق البريد الإلكتروني غير صالح`,

  inRange: (min, max) => (value, fieldName) => {
    const num = parseInt(value);
    return !isNaN(num) && num >= min && num <= max
      ? null
      : `${fieldName} must be between ${min} and ${max} - ${fieldName} يجب أن يكون بين ${min} و ${max}`;
  },

  inArray: array => (value, fieldName) =>
    array.includes(value?.toLowerCase?.())
      ? null
      : `${fieldName} must be one of: ${array.join(', ')} - ${fieldName} يجب أن يكون أحد: ${array.join(', ')}`,

  isArray: (value, fieldName) =>
    Array.isArray(value) ? null : `${fieldName} must be a list - ${fieldName} يجب أن يكون قائمة`,

  isBoolean: (value, fieldName) =>
    typeof value === 'boolean'
      ? null
      : `${fieldName} must be true or false - ${fieldName} يجب أن يكون صح أو خطأ`,

  fileSize: maxSize => (file, fieldName) =>
    file?.size <= maxSize
      ? null
      : `${fieldName} size must be less than ${maxSize / 1024 / 1024}MB - حجم ${fieldName} يجب أن يكون أقل من ${maxSize / 1024 / 1024}MB`,

  fileType: allowedTypes => (file, fieldName) =>
    allowedTypes.includes(file?.mimetype)
      ? null
      : `${fieldName} type must be one of: ${allowedTypes.join(', ')} - نوع ${fieldName} يجب أن يكون أحد: ${allowedTypes.join(', ')}`,

  // قواعد جديدة للتحقق من البيانات الطبية
  validateMedicalCode: (value, fieldName) => {
    const codePattern = /^[A-Z]{1,2}\d{3,6}$/;
    return codePattern.test(value) 
      ? null 
      : `${fieldName} must be a valid medical code (e.g., AB12345) - ${fieldName} يجب أن يكون رمزاً طبياً صالحاً`;
  },

  validateDate: (value, fieldName) => {
    const date = new Date(value);
    return !isNaN(date.getTime())
      ? null
      : `${fieldName} must be a valid date - ${fieldName} يجب أن يكون تاريخاً صالحاً`;
  },

  validatePastDate: (value, fieldName) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date <= new Date()
      ? null
      : `${fieldName} must be a past date - ${fieldName} يجب أن يكون تاريخاً في الماضي`;
  },

  validateFutureDate: (value, fieldName) => {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date > new Date()
      ? null
      : `${fieldName} must be a future date - ${fieldName} يجب أن يكون تاريخاً في المستقبل`;
  },

  validatePhoneNumber: (value, fieldName) => {
    const phonePattern = /^\+?[1-9]\d{1,14}$/;
    return phonePattern.test(value)
      ? null
      : `${fieldName} must be a valid phone number - ${fieldName} يجب أن يكون رقم هاتف صالح`;
  },

  validatePassword: (value, fieldName) => {
    const errors = [];
    if (value.length < 8) {
      errors.push('Password must be at least 8 characters - كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('Password must contain uppercase letters - كلمة المرور يجب أن تحتوي على أحرف كبيرة');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('Password must contain lowercase letters - كلمة المرور يجب أن تحتوي على أحرف صغيرة');
    }
    if (!/[0-9]/.test(value)) {
      errors.push('Password must contain numbers - كلمة المرور يجب أن تحتوي على أرقام');
    }
    if (!/[!@#$%^&*]/.test(value)) {
      errors.push('Password must contain special characters - كلمة المرور يجب أن تحتوي على رموز خاصة');
    }
    return errors.length === 0 ? null : errors.join(', ');
  },

  // التحقق من سلامة البيانات
  sanitizeString: (value) => {
    if (typeof value !== 'string') return '';
    return value.trim()
      .replace(/[<>]/g, '') // منع XSS
      .replace(/\s+/g, ' '); // تنظيف المسافات الزائدة
  },

  sanitizeNumber: (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
};

// المخططات المحدثة للتحقق
const ValidationSchemas = {
  patient: {
    fullName: [
      ValidationRules.required,
      ValidationRules.minLength(3),
      ValidationRules.maxLength(50),
    ],
    age: [
      ValidationRules.required,
      ValidationRules.numeric,
      ValidationRules.inRange(VALIDATION.AGE.MIN, VALIDATION.AGE.MAX),
    ],
    gender: [ValidationRules.required, ValidationRules.inArray(VALIDATION.GENDER)],
    medicalConditions: [ValidationRules.isArray],
    hadSurgeries: [ValidationRules.isBoolean],
    phoneNumber: [ValidationRules.required, ValidationRules.validatePhoneNumber],
    birthDate: [ValidationRules.required, ValidationRules.validatePastDate],
    emergencyContact: [ValidationRules.validatePhoneNumber],
    bloodType: [ValidationRules.inArray(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])],
  },

  doctor: {
    fullName: [
      ValidationRules.required,
      ValidationRules.minLength(3),
      ValidationRules.maxLength(50),
    ],
    specialization: [
      ValidationRules.required,
      ValidationRules.minLength(2),
      ValidationRules.maxLength(50),
    ],
    licenseNumber: [ValidationRules.required, ValidationRules.minLength(5)],
    workExperience: [
      ValidationRules.required,
      ValidationRules.numeric,
      ValidationRules.inRange(0, 70),
    ],
    medicalCode: [ValidationRules.required, ValidationRules.validateMedicalCode],
    availability: [ValidationRules.required, ValidationRules.isArray],
    languages: [ValidationRules.isArray],
  },

  appointment: {
    date: [ValidationRules.required, ValidationRules.validateFutureDate],
    duration: [ValidationRules.required, ValidationRules.inRange(15, 120)],
    type: [ValidationRules.required, ValidationRules.inArray(['initial', 'follow-up', 'emergency'])],
  },

  prescription: {
    issueDate: [ValidationRules.required, ValidationRules.validatePastDate],
    expiryDate: [ValidationRules.required, ValidationRules.validateFutureDate],
    medications: [ValidationRules.required, ValidationRules.isArray],
  }
};

/**
 * وظيفة التحقق من البيانات المحسنة
 * @param {Object} data - البيانات المراد التحقق منها
 * @param {string} schemaName - اسم المخطط
 * @throws {ValidationError} في حالة فشل التحقق
 */
export const validateSchema = (data, schemaName) => {
  const schema = ValidationSchemas[schemaName];
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaName} - مخطط غير معروف`);
  }

  const errors = [];
  const sanitizedData = {};

  for (const [field, rules] of Object.entries(schema)) {
    // تنظيف البيانات أولاً
    const value = typeof data[field] === 'string' 
      ? ValidationRules.sanitizeString(data[field])
      : data[field];
    
    sanitizedData[field] = value;

    // تطبيق قواعد التحقق
    for (const rule of rules) {
      const error = rule(value, field);
      if (error) {
        errors.push(error);
        break;
      }
    }
  }

  if (errors.length > 0) {
    logger.warn('Validation failed:', { schemaName, errors });
    throw new ValidationError(errors);
  }

  return sanitizedData;
};

/**
 * Validates patient registration data
 * التحقق من بيانات تسجيل المريض
 */
export const validatePatientData = data => validateSchema(data, 'patient');

/**
 * Validates doctor registration data
 * التحقق من بيانات تسجيل الطبيب
 */
export const validateDoctorData = data => validateSchema(data, 'doctor');

/**
 * Validates medical file uploads
 * التحقق من ملفات التحميل الطبية
 */
export const validateMedicalFile = file =>
  validateSchema({ size: file.size, type: file.mimetype }, 'medicalFile');
