/**
 * Patient service for handling patient operations
 * @module services/patient
 */
import { authService } from './auth.service.js';
import { firestoreService } from './firestore.service.js';
import { stateService } from './state.service.js';
import { logger } from '../utils/logger.js';

class PatientService {
  constructor() {
    this.auth = authService;
    this.collection = 'patients';
  }

  /**
   * Validate patient registration data
   * @param {Object} patientData - Patient registration data
   * @throws {Error} If validation fails
   */
  validatePatientData(patientData) {
    const errors = [];
    const requiredFields = ['fullName', 'age', 'gender'];

    requiredFields.forEach(field => {
      if (!patientData[field]?.toString().trim()) {
        errors.push(`${field} is required - ${field} مطلوب`);
      }
    });

    // التحقق من العمر
    const age = parseInt(patientData.age);
    if (isNaN(age) || age < 0 || age > 120) {
      errors.push('Age must be between 0 and 120 - العمر يجب أن يكون بين 0 و 120');
    }

    // التحقق من الجنس
    if (!['male', 'female'].includes(patientData.gender?.toLowerCase())) {
      errors.push('Gender must be male or female - الجنس يجب أن يكون ذكر أو أنثى');
    }

    // التحقق من تنسيق الحالات الطبية
    if (patientData.medicalConditions && !Array.isArray(patientData.medicalConditions)) {
      errors.push('Medical conditions must be an array - الحالات الطبية يجب أن تكون مصفوفة');
    }

    // التحقق من قيمة العمليات الجراحية
    if (typeof patientData.hadSurgeries !== 'boolean') {
      errors.push(
        'Had surgeries must be true or false - يجب تحديد ما إذا كان المريض قد خضع لعمليات جراحية'
      );
    }

    // التحقق من تنسيق العمليات الجراحية إذا كانت موجودة
    if (patientData.hadSurgeries === true) {
      if (!Array.isArray(patientData.surgeries) || patientData.surgeries.length === 0) {
        errors.push(
          'Surgeries list is required when hadSurgeries is true - قائمة العمليات الجراحية مطلوبة'
        );
      }
    }

    if (errors.length > 0) {
      throw new Error('Validation failed: ' + errors.join(', '));
    }
  }

  /**
   * Register a new patient with email
   * @param {Object} registrationData - Registration data including email, password, and patient info
   * @returns {Promise<Object>} Patient data with JWT token
   */
  async registerWithEmail(registrationData) {
    try {
      const { email, password, ...patientData } = registrationData;

      // التحقق من صحة بيانات المريض
      this.validatePatientData(patientData);

      // إنشاء حساب المصادقة
      const { user, token } = await this.auth.registerWithEmail({
        email,
        password,
        ...patientData,
      });

      // تخزين بيانات المريض في Firestore
      const patientProfile = {
        uid: user.uid,
        email,
        fullName: patientData.fullName,
        age: parseInt(patientData.age),
        gender: patientData.gender.toLowerCase(),
        medicalConditions: patientData.medicalConditions || [],
        hadSurgeries: Boolean(patientData.hadSurgeries),
        surgeries: patientData.hadSurgeries ? patientData.surgeries : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestoreService.setDoc(this.collection, user.uid, patientProfile);

      // Update state with new patient
      stateService.setPatient(user.uid, patientProfile);

      logger.info(`New patient registered successfully: ${email}`);
      return {
        user,
        token,
        profile: patientProfile,
      };
    } catch (error) {
      logger.error('Error registering patient:', error);
      throw error;
    }
  }

  /**
   * Register a new patient with Google
   * @param {Object} patientData - Patient registration data
   * @returns {Promise<Object>} Patient data with JWT token
   */
  async registerWithGoogle(patientData) {
    try {
      // التحقق من صحة بيانات المريض
      this.validatePatientData(patientData);

      // تسجيل الدخول باستخدام جوجل
      const { user, token } = await this.auth.signInWithGoogleAndRegister();

      // تخزين بيانات المريض في Firestore
      const patientProfile = {
        uid: user.uid,
        email: user.email,
        fullName: patientData.fullName,
        age: parseInt(patientData.age),
        gender: patientData.gender.toLowerCase(),
        medicalConditions: patientData.medicalConditions || [],
        hadSurgeries: Boolean(patientData.hadSurgeries),
        surgeries: patientData.hadSurgeries ? patientData.surgeries : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestoreService.setDoc(this.collection, user.uid, patientProfile);

      // Update state with new patient
      stateService.setPatient(user.uid, patientProfile);

      logger.info(`New patient registered with Google: ${user.email}`);
      return {
        user,
        token,
        profile: patientProfile,
      };
    } catch (error) {
      logger.error('Error registering patient with Google:', error);
      throw error;
    }
  }

  /**
   * Get patient profile by ID
   * @param {string} patientId - The patient's ID
   * @returns {Promise<Object>} Patient profile data
   */
  async getPatientProfile(patientId) {
    try {
      // First check state cache
      let patientData = stateService.getPatient(patientId);

      if (!patientData) {
        // If not in state, fetch from Firestore
        patientData = await firestoreService.getDoc(this.collection, patientId);
        if (!patientData) {
          throw new Error('Patient not found - المريض غير موجود');
        }
        // Update state with fetched data
        stateService.setPatient(patientId, patientData);
      }

      return patientData;
    } catch (error) {
      logger.error('Error getting patient profile:', error);
      throw error;
    }
  }

  /**
   * Update patient medical data
   * @param {string} patientId - The patient's ID
   * @param {Object} medicalData - Medical data to update
   * @returns {Promise<Object>} Updated patient data
   */
  async updateMedicalData(patientId, medicalData) {
    try {
      const validatedData = {
        medicalConditions: medicalData.medicalConditions || [],
        hadSurgeries: Boolean(medicalData.hadSurgeries),
        surgeries: medicalData.hadSurgeries ? medicalData.surgeries : [],
        updatedAt: new Date(),
      };

      await firestoreService.updateDoc(this.collection, patientId, validatedData);

      // Update state
      const currentData = stateService.getPatient(patientId);
      if (currentData) {
        stateService.setPatient(patientId, {
          ...currentData,
          ...validatedData,
        });
      }

      return this.getPatientProfile(patientId);
    } catch (error) {
      logger.error('Error updating medical data:', error);
      throw error;
    }
  }

  /**
   * Search for patients by email, phone, or name
   * @param {Object} searchParams - Search parameters (email, phone, name)
   * @returns {Promise<Array>} Array of limited patient information
   */
  async searchPatients(searchParams) {
    try {
      const limitedData = [];
      const snapshot = await firestoreService.searchPatients(searchParams);

      // تحويل نتائج البحث إلى بيانات محدودة وآمنة
      for (const patient of snapshot) {
        limitedData.push({
          id: patient.uid,
          name: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          // حقول إضافية مفيدة للأطباء ولكن غير حساسة
          lastUpdated: patient.updatedAt,
          hasActiveMedicalConditions: patient.medicalConditions?.length > 0 || false,
        });
      }

      logger.info('تم البحث عن المرضى باستخدام المعايير:', searchParams);
      return limitedData;
    } catch (error) {
      logger.error('خطأ في البحث عن المرضى:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const patientService = new PatientService();
