/**
 * Request validation middleware
 * @module middleware/validation
 */
import { BadRequestError } from './error.middleware.js';
import {
  validatePatientData,
  validateDoctorData,
  validateMedicalFile,
} from '../utils/validation.js';

/**
 * Creates a validation middleware for a specific schema
 * @param {Function} validator - Validation function to use
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const createValidator = (validator, source = 'body') => {
  return (req, _res, next) => {
    try {
      validator(req[source]);
      next();
    } catch (error) {
      next(new BadRequestError(error.message));
    }
  };
};

// Validator middleware for patient data
export const validatePatient = createValidator(validatePatientData);

// Validator middleware for doctor data
export const validateDoctor = createValidator(validateDoctorData);

// File upload validation middleware
export const validateFileUpload = (req, _res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No file uploaded - لم يتم رفع أي ملف');
    }
    validateMedicalFile(req.file);
    next();
  } catch (error) {
    next(new BadRequestError(error.message));
  }
};
