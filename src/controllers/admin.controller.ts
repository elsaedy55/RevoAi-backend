import { Request, Response } from 'express';
import { firestoreService } from '../../services/firestore.service.js';
import { notificationService } from '../../services/notification.service.js';
import { logger } from '../../utils/logger.js';

export class AdminController {
  /**
   * تغيير حالة موافقة الطبيب
   */
  static async toggleDoctorApproval(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId } = req.params;
      const { approved } = req.body;

      // التحقق من وجود بيانات الطبيب
      const doctorData = await firestoreService.getDoc('doctors', doctorId);
      if (!doctorData) {
        res.status(404).json({
          error: 'Doctor not found - الطبيب غير موجود'
        });
        return;
      }

      // تحديث حالة موافقة الطبيب
      await firestoreService.updateDoc('doctors', doctorId, {
        approved,
        status: approved ? 'active' : 'pending',
        updatedAt: new Date()
      });

      // إرسال إشعار للطبيب
      await notificationService.handleDoctorApprovalChange({ doctorId, approved });

      logger.info(`Doctor ${doctorId} approval status updated to ${approved}`);

      res.json({
        message: approved 
          ? 'Doctor approved successfully - تم الموافقة على الطبيب بنجاح'
          : 'Doctor approval revoked - تم إلغاء الموافقة على الطبيب',
        doctorId
      });
    } catch (error) {
      logger.error('Error updating doctor approval:', error);
      res.status(500).json({
        error: 'Failed to update doctor approval - فشل تحديث موافقة الطبيب'
      });
    }
  }

  /**
   * الحصول على قائمة الأطباء المعلقين
   */
  static async getPendingDoctors(req: Request, res: Response): Promise<void> {
    try {
      const pendingDoctors = await firestoreService.searchDoctors({ 
        status: 'pending',
        approved: false 
      });

      res.json({
        doctors: pendingDoctors,
        count: pendingDoctors.length
      });
    } catch (error) {
      logger.error('Error fetching pending doctors:', error);
      res.status(500).json({
        error: 'Failed to fetch pending doctors - فشل جلب قائمة الأطباء المعلقين'
      });
    }
  }
}