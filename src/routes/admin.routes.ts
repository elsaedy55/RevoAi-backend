import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route GET /api/admin/doctors/pending
 * @desc Get list of pending doctors
 * الحصول على قائمة الأطباء المعلقين
 */
router.get('/doctors/pending', requireAuth, isAdmin, AdminController.getPendingDoctors);

/**
 * @route PUT /api/admin/doctors/:doctorId/approval
 * @desc Update doctor approval status
 * تحديث حالة موافقة الطبيب
 */
router.put('/doctors/:doctorId/approval', requireAuth, isAdmin, AdminController.toggleDoctorApproval);

export default router;