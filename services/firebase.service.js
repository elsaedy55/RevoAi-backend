/**
 * Firebase core service
 * @module services/firebase
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../config/firebase.config.js';
import { logger } from '../utils/logger.js';

class FirebaseService {
  constructor() {
    this.app = initializeApp(FIREBASE_CONFIG);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
  }

  getAuth() {
    return this.auth;
  }

  getFirestore() {
    return this.db;
  }

  getStorage() {
    return this.storage;
  }

  /**
   * Upload a file to Firebase Storage
   * @param {File} file - The file to upload
   * @param {string} path - The storage path including filename
   * @returns {Promise<string>} Download URL of the uploaded file
   */
  async uploadFile(file, path) {
    try {
      const storageRef = ref(this.storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      logger.info(`File uploaded successfully to ${path}`);
      return downloadURL;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const firebaseService = new FirebaseService();
