/**
 * Enhanced validation utilities with bilingual error messages
 * أدوات التحقق من صحة البيانات مع رسائل خطأ ثنائية اللغة
 * @module utils/validation
 */
import { VALIDATION } from '../config/constants.js';

export class ValidationError extends Error {
  constructor(errors) {
    super(Array.isArray(errors) ? errors.join(', ') : errors);
    this.name = 'ValidationError';
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

/**
 * Common validation rules with bilingual error messages
 * قواعد التحقق المشتركة مع رسائل خطأ ثنائية اللغة
 */
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
};

/**
 * Validation schemas for different entity types
 * مخططات التحقق لمختلف أنواع الكيانات
 */
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
  },

  medicalFile: {
    size: [ValidationRules.fileSize(VALIDATION.FILE.MAX_SIZE)],
    type: [ValidationRules.fileType(VALIDATION.FILE.ALLOWED_TYPES)],
  },
};

/**
 * Validates data against a schema
 * التحقق من البيانات مقابل المخطط
 * @param {Object} data - Data to validate
 * @param {string} schemaName - Name of the validation schema
 * @throws {ValidationError} If validation fails
 */
export const validateSchema = (data, schemaName) => {
  const schema = ValidationSchemas[schemaName];
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaName}`);
  }

  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      const error = rule(data[field], field);
      if (error) {
        errors.push(error);
        break; // Stop checking other rules for this field once one fails
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return true;
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
