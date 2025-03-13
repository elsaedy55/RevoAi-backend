/**
 * Application setup and dependency injection
 * @module config/setup
 */
import { firebaseService } from '../services/firebase.service.js';
import { stateService } from '../services/state.service.js';
import { logger } from '../utils/logger.js';

/**
 * Initialize core application services
 */
export const initializeServices = async () => {
  try {
    // Initialize Firebase services
    const auth = firebaseService.getAuth();
    const db = firebaseService.getFirestore();
    const storage = firebaseService.getStorage();

    return { auth, db, storage };
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Configure auth state observer
 */
export const setupAuthStateObserver = () => {
  const auth = firebaseService.getAuth();

  auth.onAuthStateChanged(user => {
    // Update application state
    stateService.setCurrentUser(user);

    // Log auth state changes
    logger.info(user ? `User authenticated: ${user.email}` : 'User signed out');
  });
};
