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
    this.loginAttempts = new Map();
    this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    this.MAX_LOGIN_ATTEMPTS = 5;
  }

  // تحسين مراقبة حالة المصادقة
  setupAuthStateObserver() {
    this.auth.onAuthStateChanged(async user => {
      if (user) {
        // مسح محاولات تسجيل الدخول عند نجاح المصادقة
        this.loginAttempts.delete(user.email);
        
        // تحديث توكن FCM
        await this.updateFCMToken(user);
      }
      stateService.setCurrentUser(user);
      logger.info(user ? `User authenticated: ${user.email}` : 'User signed out');
    });
  }

  // إضافة وظيفة تحديث توكن FCM
  async updateFCMToken(user) {
    try {
      const token = await this.getFCMToken();
      if (token) {
        await firestoreService.updateDoc('users', user.uid, {
          fcmToken: token,
          lastTokenUpdate: new Date()
        });
      }
    } catch (error) {
      logger.error('Error updating FCM token:', error);
    }
  }

  // تحسين التحقق من محاولات تسجيل الدخول
  checkLoginAttempts(email) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    const now = Date.now();

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      if (now - attempts.lastAttempt < this.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((this.LOCKOUT_DURATION - (now - attempts.lastAttempt)) / 1000 / 60);
        throw new Error(`Account temporarily locked. Try again in ${remainingTime} minutes - الحساب مغلق مؤقتاً. حاول مرة أخرى بعد ${remainingTime} دقيقة`);
      }
      // إعادة تعيين المحاولات بعد انتهاء فترة القفل
      attempts.count = 0;
    }

    return attempts;
  }

  // تحديث محاولات تسجيل الدخول
  updateLoginAttempts(email, success) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    if (success) {
      this.loginAttempts.delete(email);
    } else {
      attempts.count += 1;
      attempts.lastAttempt = Date.now();
      this.loginAttempts.set(email, attempts);
    }
  }

  // تحسين تسجيل الدخول بالبريد الإلكتروني
  async signInWithEmail(email, password) {
    try {
      // التحقق من محاولات تسجيل الدخول
      this.checkLoginAttempts(email);

      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // تحديث نجاح تسجيل الدخول
      this.updateLoginAttempts(email, true);
      
      const userProfile = await firestoreService.getDoc('users', userCredential.user.uid);
      
      logger.info(`User signed in successfully: ${email}`);
      return this.processAuthResult(userCredential, userProfile);
    } catch (error) {
      // تحديث فشل تسجيل الدخول
      this.updateLoginAttempts(email, false);
      
      logger.error('Error signing in with email:', error);
      throw error;
    }
  }

  /**
   * Starts the registration process
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
