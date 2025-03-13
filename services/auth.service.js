/**
 * Firebase Authentication service
 * خدمة المصادقة باستخدام Firebase
 * @module services/auth
 */
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  PhoneAuthProvider,
  signInWithCredential,
  getIdToken,
} from 'firebase/auth';
import { firebaseService } from './firebase.service.js';
import { firestoreService } from './firestore.service.js';
import { stateService } from './state.service.js';
import { logger } from '../utils/logger.js';

/**
 * User data validation rules - قواعد التحقق من صحة بيانات المستخدم
 */
const USER_VALIDATION_RULES = {
  name: value => (value?.trim() ? null : 'Full name is required - الاسم الكامل مطلوب'),
  age: value => (!value || value < 0 || value > 120 ? 'Valid age is required (0-120) - العمر يجب أن يكون بين 0 و 120' : null),
  gender: value =>
    !['male', 'female', 'other'].includes(value?.toLowerCase())
      ? 'Gender must be male, female, or other - الجنس يجب أن يكون ذكر أو أنثى أو غير ذلك'
      : null,
};

class AuthService {
  constructor() {
    this.auth = firebaseService.getAuth();
    this.googleProvider = new GoogleAuthProvider();
    this.setupAuthStateObserver();
  }

  /**
   * Sets up Firebase authentication state observer
   * إعداد مراقب حالة المصادقة في Firebase
   * @private
   */
  setupAuthStateObserver() {
    this.auth.onAuthStateChanged(user => {
      stateService.setCurrentUser(user);
      logger.info(user ? `User authenticated: ${user.email}` : 'User signed out');
    });
  }

  /**
   * Creates a standardized user profile object
   * إنشاء كائن موحد لملف المستخدم الشخصي
   * @private
   * @param {Object} user - Firebase user object - كائن مستخدم Firebase
   * @param {Object} additionalData - Additional profile data - بيانات إضافية للملف الشخصي
   * @param {string} authProvider - Authentication provider - مزود المصادقة
   * @returns {Object} Standardized user profile - ملف المستخدم الموحد
   */
  createUserProfile(user, additionalData, authProvider) {
    return {
      email: user.email,
      phoneNumber: user.phoneNumber,
      ...additionalData,
      authProvider,
      createdAt: new Date(),
    };
  }

  /**
   * Validates user registration data
   * @private
   * @param {Object} userData - User registration data
   * @throws {Error} If validation fails
   */
  validateUserData(userData) {
    const errors = Object.entries(USER_VALIDATION_RULES)
      .map(([field, validator]) => validator(userData[field]))
      .filter(error => error);

    if (errors.length > 0) {
      throw new Error('Validation failed: ' + errors.join(', '));
    }
  }

  /**
   * Processes user authentication result
   * @private
   * @param {Object} userCredential - Firebase user credential
   * @param {Object} profile - User profile data
   * @returns {Promise<Object>} Processed authentication result
   */
  async processAuthResult(userCredential, profile) {
    const token = await this.getJWTToken(userCredential.user);
    const authenticatedUser = {
      ...userCredential.user,
      profile,
    };

    stateService.setCurrentUser(authenticatedUser);

    return {
      user: userCredential.user,
      token,
      profile,
    };
  }

  /**
   * Get JWT token for authenticated user
   * @private
   * @param {Object} user - Firebase user object
   * @returns {Promise<string>} JWT token
   */
  async getJWTToken(user) {
    try {
      return await getIdToken(user, true);
    } catch (error) {
      logger.error('Error getting JWT token:', error);
      throw error;
    }
  }

  /**
   * Register a new user with email
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data with JWT token
   */
  async registerWithEmail(userData) {
    try {
      const { email, password, ...profileData } = userData;
      this.validateUserData(profileData);

      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const userProfile = this.createUserProfile(userCredential.user, profileData, 'email');

      await firestoreService.setUser(userCredential.user.uid, userProfile);

      logger.info(`New user registered successfully: ${email}`);
      return this.processAuthResult(userCredential, userProfile);
    } catch (error) {
      logger.error('Error registering user with email:', error);
      throw error;
    }
  }

  /**
   * Complete phone registration with verification code
   * @param {string} verificationId - Verification ID from startPhoneVerification
   * @param {string} verificationCode - Code received via SMS
   * @param {Object} userData - Additional user data
   * @returns {Promise<Object>} User data with JWT token
   */
  async completePhoneRegistration(verificationId, verificationCode, userData) {
    try {
      this.validateUserData(userData);

      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      const userCredential = await signInWithCredential(this.auth, credential);
      const userProfile = this.createUserProfile(userCredential.user, userData, 'phone');

      await firestoreService.setUser(userCredential.user.uid, userProfile);

      logger.info(`User registered successfully with phone: ${userCredential.user.phoneNumber}`);
      return this.processAuthResult(userCredential, userProfile);
    } catch (error) {
      logger.error('Error completing phone registration:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google and complete registration
   * @param {Object} additionalData - Additional user profile data
   * @returns {Promise<Object>} User data with JWT token
   */
  async signInWithGoogleAndRegister(additionalData = {}) {
    try {
      this.validateUserData(additionalData);

      const userCredential = await signInWithPopup(this.auth, this.googleProvider);
      const userProfile = this.createUserProfile(
        userCredential.user,
        {
          ...additionalData,
          name: additionalData.name || userCredential.user.displayName,
        },
        'google'
      );

      await firestoreService.setUser(userCredential.user.uid, userProfile);

      logger.info(`User registered with Google successfully: ${userCredential.user.email}`);
      return this.processAuthResult(userCredential, userProfile);
    } catch (error) {
      logger.error('Error registering with Google:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authenticated user data
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const userProfile = { email: userCredential.user.email };

      logger.info(`User signed in successfully: ${email}`);
      return this.processAuthResult(userCredential, userProfile);
    } catch (error) {
      logger.error('Error signing in with email:', error);
      throw error;
    }
  }

  /**
   * Start phone number verification
   * @param {string} phoneNumber - Phone number in E.164 format
   * @returns {Promise<string>} Verification ID
   */
  async startPhoneVerification(phoneNumber) {
    try {
      const provider = new PhoneAuthProvider(this.auth);
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, 60);
      logger.info(`Verification code sent to ${phoneNumber}`);
      return verificationId;
    } catch (error) {
      logger.error('Error starting phone verification:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      await signOut(this.auth);
      stateService.setCurrentUser(null);
      logger.info('User signed out successfully');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
