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
    this.notificationQueue = [];
    this.isProcessing = false;
    this.MAX_RETRIES = 3;
    this.RETRY_DELAY = 1000; // 1 second
    this.processingInterval = setInterval(() => this.processQueue(), 2000);
  }

  // إضافة إشعار إلى الطابور
  async queueNotification(notification) {
    this.notificationQueue.push({
      ...notification,
      retries: 0,
      timestamp: Date.now()
    });

    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  // معالجة طابور الإشعارات
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue[0];
        
        try {
          await this.sendNotification(notification);
          this.notificationQueue.shift(); // إزالة الإشعار بعد النجاح
        } catch (error) {
          if (notification.retries < this.MAX_RETRIES) {
            // إعادة المحاولة لاحقاً
            notification.retries++;
            notification.nextRetry = Date.now() + (this.RETRY_DELAY * notification.retries);
            this.notificationQueue.push(this.notificationQueue.shift());
          } else {
            // تسجيل الفشل وإزالة الإشعار
            logger.error('Failed to send notification after max retries:', error);
            await this.logFailedNotification(notification, error);
            this.notificationQueue.shift();
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // إرسال إشعار فردي
  async sendNotification(notification) {
    const { userId, title, body, data = {}, priority = 'high' } = notification;

    const userDoc = await firestoreService.getDoc('users', userId);
    if (!userDoc?.fcmToken) {
      throw new Error(`No FCM token found for user ${userId}`);
    }

    const message = {
      token: userDoc.fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority,
        notification: {
          channelId: 'default',
          icon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    await this.messaging.send(message);
    await this.logSuccessfulNotification(notification);
  }

  // تسجيل الإشعارات الناجحة
  async logSuccessfulNotification(notification) {
    await firestoreService.setDoc(`notifications/${Date.now()}_${notification.userId}`, {
      ...notification,
      status: 'delivered',
      deliveredAt: new Date()
    });
  }

  // تسجيل الإشعارات الفاشلة
  async logFailedNotification(notification, error) {
    await firestoreService.setDoc(`failedNotifications/${Date.now()}_${notification.userId}`, {
      ...notification,
      error: {
        message: error.message,
        code: error.code
      },
      failedAt: new Date()
    });
  }

  // تنظيف عند إغلاق التطبيق
  cleanup() {
    clearInterval(this.processingInterval);
  }

  // معالجة تحديث التشخيص
  async handleDiagnosisUpdate({ patientId, recordId, diagnosis }) {
    return this.queueNotification({
      userId: patientId,
      title: 'تحديث التشخيص',
      body: 'تم تحديث التشخيص الطبي الخاص بك',
      data: {
        type: 'DIAGNOSIS_UPDATE',
        recordId,
        diagnosis
      },
      priority: 'high'
    });
  }

  // معالجة تغيير الصلاحيات
  async handlePermissionChange({ patientId, doctorId, granted }) {
    const doctorDoc = await firestoreService.getDoc('doctors', doctorId);
    const notification = {
      userId: patientId,
      title: granted ? 'صلاحية جديدة' : 'إلغاء الصلاحية',
      body: granted 
        ? `تم منح الدكتور ${doctorDoc.name} صلاحية الوصول إلى ملفك الطبي`
        : `تم إلغاء صلاحية الدكتور ${doctorDoc.name} للوصول إلى ملفك الطبي`,
      data: {
        type: granted ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED',
        doctorId,
        doctorName: doctorDoc.name
      }
    };

    return this.queueNotification(notification);
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
