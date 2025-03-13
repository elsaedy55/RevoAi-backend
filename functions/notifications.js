/**
 * Firebase Cloud Functions for real-time notifications
 * دوال Firebase السحابية للإشعارات الفورية
 * @module functions/notifications
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { logger } from '../utils/logger.js';

admin.initializeApp();

/**
 * Trigger: When medical record diagnosis is updated
 * المشغل: عند تحديث التشخيص في السجل الطبي
 */
export const onDiagnosisUpdate = functions.firestore
  .document('patients/{patientId}/medicalRecords/{recordId}')
  .onUpdate(async (change, context) => {
    const { diagnosis } = change.after.data();
    const patientId = context.params.patientId;

    try {
      // جلب معلومات المريض - Fetch patient information
      const patientDoc = await admin.firestore().collection('patients').doc(patientId).get();
      const patientData = patientDoc.data();

      if (!patientDoc.exists) {
        logger.warn('Patient not found - المريض غير موجود:', patientId);
        return;
      }

      const patientFCMToken = patientData?.fcmToken;
      if (!patientFCMToken) {
        logger.warn('No FCM token found for patient - لا يوجد توكن FCM للمريض:', patientId);
        return;
      }

      // إرسال الإشعار - Send notification
      await admin.messaging().send({
        token: patientFCMToken,
        notification: {
          title: 'Diagnosis Update - تحديث التشخيص',
          body: 'Your medical diagnosis has been updated - تم تحديث تشخيصك الطبي، يرجى المراجعة',
        },
        data: {
          type: 'DIAGNOSIS_UPDATE',
          patientId: patientId,
          recordId: context.params.recordId,
          diagnosis,
        },
      });
    } catch (error) {
      logger.error('Error sending diagnosis update notification - خطأ في إرسال إشعار تحديث التشخيص:', error);
    }
  });

/**
 * Trigger: When doctor is granted access to patient records
 * المشغل: عند منح الطبيب صلاحية الوصول لسجلات المريض
 */
export const onPermissionGranted = functions.firestore
  .document('patients/{patientId}/permissions/{doctorId}')
  .onCreate(async (snap, context) => {
    const doctorId = context.params.doctorId;
    const patientId = context.params.patientId;

    try {
      // جلب معلومات الطبيب والمريض
      const [doctorDoc, patientDoc] = await Promise.all([
        admin.firestore().collection('doctors').doc(doctorId).get(),
        admin.firestore().collection('patients').doc(patientId).get(),
      ]);

      const doctorData = doctorDoc.data();
      const patientData = patientDoc.data();
      const doctorFCMToken = doctorData?.fcmToken;

      if (!doctorFCMToken) {
        logger.warn('لا يوجد توكن فسي ام للطبيب:', doctorId);
        return;
      }

      // إرسال الإشعار
      await admin.messaging().send({
        token: doctorFCMToken,
        notification: {
          title: 'صلاحية جديدة',
          body: `تم منحك صلاحية الوصول لملف المريض ${patientData?.fullName || 'غير معروف'}`,
        },
        data: {
          type: 'PERMISSION_GRANTED',
          patientId: patientId,
          doctorId: doctorId,
        },
      });
    } catch (error) {
      logger.error('خطأ في إرسال إشعار منح الصلاحيات:', error);
    }
  });

/**
 * Trigger: When doctor's access is revoked
 * المشغل: عند إلغاء صلاحية الطبيب
 */
export const onPermissionRevoked = functions.firestore
  .document('patients/{patientId}/permissions/{doctorId}')
  .onDelete(async (snap, context) => {
    const doctorId = context.params.doctorId;
    const patientId = context.params.patientId;

    try {
      // جلب معلومات الطبيب والمريض
      const [doctorDoc, patientDoc] = await Promise.all([
        admin.firestore().collection('doctors').doc(doctorId).get(),
        admin.firestore().collection('patients').doc(patientId).get(),
      ]);

      const doctorData = doctorDoc.data();
      const patientData = patientDoc.data();
      const patientFCMToken = patientData?.fcmToken;

      if (!patientFCMToken) {
        logger.warn('لا يوجد توكن فسي ام للمريض:', patientId);
        return;
      }

      // إرسال الإشعار
      await admin.messaging().send({
        token: patientFCMToken,
        notification: {
          title: 'إلغاء الصلاحية',
          body: `تم إلغاء صلاحية الدكتور ${doctorData?.name || 'غير معروف'} للوصول إلى ملفك الطبي`,
        },
        data: {
          type: 'PERMISSION_REVOKED',
          patientId: patientId,
          doctorId: doctorId,
        },
      });
    } catch (error) {
      logger.error('خطأ في إرسال إشعار إلغاء الصلاحيات:', error);
    }
  });

/**
 * Trigger: When a doctor requests access to patient records
 * المشغل: عند طلب الطبيب الوصول إلى سجلات المريض
 */
export const onAccessRequestCreated = functions.firestore
  .document('patients/{patientId}/accessRequests/{doctorId}')
  .onCreate(async (snap, context) => {
    const doctorId = context.params.doctorId;
    const patientId = context.params.patientId;

    try {
      // جلب معلومات الطبيب والمريض
      const [doctorDoc, patientDoc] = await Promise.all([
        admin.firestore().collection('doctors').doc(doctorId).get(),
        admin.firestore().collection('patients').doc(patientId).get(),
      ]);

      if (!doctorDoc.exists || !patientDoc.exists) {
        logger.warn('الطبيب أو المريض غير موجود');
        return;
      }

      const doctorData = doctorDoc.data();
      const patientData = patientDoc.data();
      const patientFCMToken = patientData?.fcmToken;

      if (!patientFCMToken) {
        logger.warn('لا يوجد توكن FCM للمريض:', patientId);
        return;
      }

      // إرسال الإشعار
      await admin.messaging().send({
        token: patientFCMToken,
        notification: {
          title: 'طلب وصول جديد',
          body: `الدكتور ${doctorData.fullName} (${doctorData.specialization}) يطلب الوصول إلى ملفك الطبي`,
        },
        data: {
          type: 'ACCESS_REQUEST',
          patientId: patientId,
          doctorId: doctorId,
          doctorName: doctorData.fullName,
          doctorSpecialization: doctorData.specialization,
          requestId: snap.id,
        },
      });

      // تحديث حالة الطلب
      await snap.ref.update({
        notificationSent: true,
        notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`تم إرسال إشعار طلب الوصول للمريض ${patientId} من الطبيب ${doctorId}`);
    } catch (error) {
      logger.error('خطأ في إرسال إشعار طلب الوصول:', error);
    }
  });
