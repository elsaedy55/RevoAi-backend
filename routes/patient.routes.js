/**
 * Patient routes
 * @module routes/patient
 */
import express from 'express';
import multer from 'multer';
import { patientService } from '../services/patient.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/patients/register/email
 * @desc تسجيل مريض جديد باستخدام البريد الإلكتروني
 */
router.post('/register/email', async (req, res) => {
  try {
    const result = await patientService.registerWithEmail(req.body);

    res.status(201).json({
      message: 'Registration successful - تم التسجيل بنجاح',
      ...result,
    });
  } catch (error) {
    logger.error('Patient registration failed:', error);
    res.status(400).json({
      error: error.message || 'Registration failed - فشل التسجيل',
    });
  }
});

/**
 * @route POST /api/patients/register/google
 * @desc تسجيل مريض جديد باستخدام حساب جوجل
 */
router.post('/register/google', async (req, res) => {
  try {
    const result = await patientService.registerWithGoogle(req.body);

    res.status(201).json({
      message: 'Registration successful - تم التسجيل بنجاح',
      ...result,
    });
  } catch (error) {
    logger.error('Patient registration with Google failed:', error);
    res.status(400).json({
      error: error.message || 'Registration failed - فشل التسجيل',
    });
  }
});

/**
 * @route GET /api/patients/profile
 * @desc جلب الملف الشخصي للمريض
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const patientProfile = await patientService.getPatientProfile(req.user.uid);
    res.json(patientProfile);
  } catch (error) {
    logger.error('Error fetching patient profile:', error);
    res.status(404).json({
      error: error.message || 'Profile not found - الملف الشخصي غير موجود',
    });
  }
});

/**
 * @route PUT /api/patients/medical-data
 * @desc تحديث البيانات الطبية للمريض
 */
router.put('/medical-data', requireAuth, async (req, res) => {
  try {
    const updatedProfile = await patientService.updateMedicalData(req.user.uid, req.body);

    res.json({
      message: 'Medical data updated successfully - تم تحديث البيانات الطبية بنجاح',
      profile: updatedProfile,
    });
  } catch (error) {
    logger.error('Error updating medical data:', error);
    res.status(400).json({
      error: error.message || 'Update failed - فشل التحديث',
    });
  }
});

export default router;
