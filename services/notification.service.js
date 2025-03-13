/**
 * Notification service implementing observer pattern
 * @module services/notification
 */
import { BaseService } from './base.service.js';
import { NOTIFICATION_TYPES } from '../config/constants.js';
import { firebaseService } from './firebase.service.js';
import { logger } from '../utils/logger.js';

class NotificationService extends BaseService {
  constructor() {
    super('notifications');
    this.messaging = firebaseService.getMessaging();
    this.observers = new Map();
  }

  /**
   * Register an observer for a specific notification type
   * @param {string} type - Notification type
   * @param {Function} callback - Observer callback
   */
  subscribe(type, callback) {
    if (!NOTIFICATION_TYPES[type]) {
      throw new Error(`Invalid notification type: ${type}`);
    }

    if (!this.observers.has(type)) {
      this.observers.set(type, new Set());
    }
    this.observers.get(type).add(callback);
  }

  /**
   * Remove an observer for a specific notification type
   * @param {string} type - Notification type
   * @param {Function} callback - Observer callback
   */
  unsubscribe(type, callback) {
    if (this.observers.has(type)) {
      this.observers.get(type).delete(callback);
    }
  }

  /**
   * Notify all observers of a specific type
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  async notify(type, data) {
    const observers = this.observers.get(type);
    if (observers) {
      for (const callback of observers) {
        await callback(data);
      }
    }
  }

  /**
   * Send push notification to a specific user
   * @param {string} userId - Target user ID
   * @param {Object} notification - Notification data
   */
  async sendPushNotification(userId, notification) {
    return this.handleOperation(async () => {
      const { token, title, body, data } = notification;

      if (!token) {
        logger.warn(`No FCM token found for user: ${userId}`);
        return;
      }

      await this.messaging.send({
        token,
        notification: { title, body },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`Push notification sent to user: ${userId}`);
    }, `Failed to send push notification to user: ${userId}`);
  }

  /**
   * Handle diagnosis update notification
   * @param {Object} data - Diagnosis update data
   */
  async handleDiagnosisUpdate(data) {
    const { patientId, recordId, diagnosis } = data;

    return this.handleOperation(async () => {
      await this.notify(NOTIFICATION_TYPES.DIAGNOSIS_UPDATE, {
        patientId,
        recordId,
        diagnosis,
        timestamp: new Date(),
      });
    }, 'Failed to handle diagnosis update notification');
  }

  /**
   * Handle permission change notification
   * @param {Object} data - Permission change data
   */
  async handlePermissionChange(data) {
    const { patientId, doctorId, granted } = data;
    const type = granted
      ? NOTIFICATION_TYPES.PERMISSION_GRANTED
      : NOTIFICATION_TYPES.PERMISSION_REVOKED;

    return this.handleOperation(async () => {
      await this.notify(type, {
        patientId,
        doctorId,
        timestamp: new Date(),
      });
    }, 'Failed to handle permission change notification');
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
