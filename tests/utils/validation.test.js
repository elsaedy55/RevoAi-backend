import {
  ValidationError,
  validatePatientData,
  validateDoctorData,
  validateMedicalFile,
} from '../../utils/validation.js';
import { VALIDATION } from '../../config/constants.js';

describe('Validation Utilities', () => {
  describe('Patient Data Validation', () => {
    const validPatientData = {
      fullName: 'John Doe',
      age: '30',
      gender: 'male',
      medicalConditions: ['Diabetes', 'Hypertension'],
      hadSurgeries: true,
    };

    test('should validate correct patient data', () => {
      expect(() => validatePatientData(validPatientData)).not.toThrow();
    });

    test('should throw ValidationError for missing required fields', () => {
      const invalidData = { ...validPatientData };
      delete invalidData.fullName;

      expect(() => validatePatientData(invalidData)).toThrow(ValidationError);
    });

    test('should throw ValidationError for invalid age', () => {
      const invalidData = {
        ...validPatientData,
        age: '150', // Above maximum age
      };

      expect(() => validatePatientData(invalidData)).toThrow(ValidationError);
    });

    test('should throw ValidationError for invalid gender', () => {
      const invalidData = {
        ...validPatientData,
        gender: 'invalid',
      };

      expect(() => validatePatientData(invalidData)).toThrow(ValidationError);
    });
  });

  describe('Doctor Data Validation', () => {
    const validDoctorData = {
      fullName: 'Dr. Jane Smith',
      specialization: 'Cardiology',
      licenseNumber: 'MED123456',
      workExperience: '15',
    };

    test('should validate correct doctor data', () => {
      expect(() => validateDoctorData(validDoctorData)).not.toThrow();
    });

    test('should throw ValidationError for invalid license number', () => {
      const invalidData = {
        ...validDoctorData,
        licenseNumber: '123', // Too short
      };

      expect(() => validateDoctorData(invalidData)).toThrow(ValidationError);
    });

    test('should throw ValidationError for invalid work experience', () => {
      const invalidData = {
        ...validDoctorData,
        workExperience: '75', // Above maximum
      };

      expect(() => validateDoctorData(invalidData)).toThrow(ValidationError);
    });
  });

  describe('Medical File Validation', () => {
    const validFile = {
      size: 1024 * 1024, // 1MB
      mimetype: 'image/jpeg',
    };

    test('should validate correct file', () => {
      expect(() => validateMedicalFile(validFile)).not.toThrow();
    });

    test('should throw ValidationError for oversized file', () => {
      const invalidFile = {
        ...validFile,
        size: VALIDATION.FILE.MAX_SIZE + 1,
      };

      expect(() => validateMedicalFile(invalidFile)).toThrow(ValidationError);
    });

    test('should throw ValidationError for invalid file type', () => {
      const invalidFile = {
        ...validFile,
        mimetype: 'application/pdf',
      };

      expect(() => validateMedicalFile(invalidFile)).toThrow(ValidationError);
    });
  });
});
