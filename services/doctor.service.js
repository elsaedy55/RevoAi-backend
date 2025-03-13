/**
 * Doctor service for handling doctor-specific operations
 * @module services/doctor
 */
import { authService } from './auth.service.js';
import { firebaseService } from './firebase.service.js';
import { firestoreService } from './firestore.service.js';
import { stateService } from './state.service.js';
import { logger } from '../utils/logger.js';

class DoctorService {
  constructor() {
    this.auth = authService;
    this.storage = firebaseService.getStorage();
    this.collection = 'doctors';
  }

  /**
   * Validate doctor registration data
   * @param {Object} doctorData - Doctor registration data
   * @throws {Error} If validation fails
   */
  validateDoctorData(doctorData) {
    const errors = [];
    const requiredFields = [
      'fullName',
      'specialization',
      'licenseNumber',
      'workExperience',
      'education',
    ];

    requiredFields.forEach(field => {
      if (!doctorData[field]?.trim()) {
        errors.push(`${field} is required - ${field} مطلوب`);
      }
    });

    if (errors.length > 0) {
      throw new Error('Validation failed: ' + errors.join(', '));
    }
  }

  /**
   * Register a new doctor with email
   * @param {Object} registrationData - Registration data including email, password, and doctor info
   * @param {File} licenseImage - License card image file
   * @returns {Promise<Object>} Doctor data with JWT token
   */
  async registerWithEmail(registrationData, licenseImage) {
    try {
      const { email, password, ...doctorData } = registrationData;

      this.validateDoctorData(doctorData);

      const { user, token } = await this.auth.registerWithEmail({
        email,
        password,
        ...doctorData,
      });

      const imagePath = `licenses/${user.uid}_${licenseImage.name}`;
      const imageUrl = await firebaseService.uploadFile(licenseImage, imagePath);

      const doctorProfile = {
        uid: user.uid,
        email,
        fullName: doctorData.fullName,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        workExperience: doctorData.workExperience,
        education: doctorData.education,
        licenseImageUrl: imageUrl,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestoreService.setDoc(this.collection, user.uid, doctorProfile);

      // Update state with new doctor
      stateService.setDoctor(user.uid, doctorProfile);

      logger.info(`New doctor registered successfully: ${email}`);
      return {
        user,
        token,
        profile: doctorProfile,
      };
    } catch (error) {
      logger.error('Error registering doctor with email:', error);
      throw error;
    }
  }

  /**
   * Register a new doctor with Google
   * @param {Object} doctorData - Doctor registration data
   * @param {File} licenseImage - License card image file
   * @returns {Promise<Object>} Doctor data with JWT token
   */
  async registerWithGoogle(doctorData, licenseImage) {
    try {
      this.validateDoctorData(doctorData);

      const { user, token } = await this.auth.signInWithGoogleAndRegister();

      const imagePath = `licenses/${user.uid}_${licenseImage.name}`;
      const imageUrl = await firebaseService.uploadFile(licenseImage, imagePath);

      const doctorProfile = {
        uid: user.uid,
        email: user.email,
        fullName: doctorData.fullName,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        workExperience: doctorData.workExperience,
        education: doctorData.education,
        licenseImageUrl: imageUrl,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestoreService.setDoc(this.collection, user.uid, doctorProfile);

      // Update state with new doctor
      stateService.setDoctor(user.uid, doctorProfile);

      logger.info(`New doctor registered with Google successfully: ${user.email}`);
      return {
        user,
        token,
        profile: doctorProfile,
      };
    } catch (error) {
      logger.error('Error registering doctor with Google:', error);
      throw error;
    }
  }

  /**
   * Get doctor profile by ID
   * @param {string} doctorId - The doctor's ID
   * @returns {Promise<Object>} Doctor profile data
   */
  async getDoctorProfile(doctorId) {
    try {
      // First check state cache
      let doctorData = stateService.getDoctor(doctorId);

      if (!doctorData) {
        // If not in state, fetch from Firestore
        doctorData = await firestoreService.getDoc(this.collection, doctorId);
        if (!doctorData) {
          throw new Error('Doctor not found - الطبيب غير موجود');
        }
        // Update state with fetched data
        stateService.setDoctor(doctorId, doctorData);
      }

      return doctorData;
    } catch (error) {
      logger.error('Error getting doctor profile:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const doctorService = new DoctorService();
