/**
 * Doctor registration routes
 * مسارات تسجيل وإدارة الأطباء
 * @module routes/doctor
 */
import express from 'express';
import multer from 'multer';
import { doctorService } from '../services/doctor.service.js';
import { patientService } from '../services/patient.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Configure multer for license image upload
 * إعداد multer لرفع صور رخص الأطباء
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit - الحد الأقصى 5 ميجابايت
  },
});

/**
 * @route POST /api/doctors/register/email
 * @desc Register a new doctor with email authentication
 * تسجيل طبيب جديد باستخدام البريد الإلكتروني
 * @param {Object} req.body - Registration data including email, password, and doctor info
 * @param {File} req.file - License image file
 * @returns {Object} Registered doctor data with JWT token
 */
router.post('/register/email', upload.single('licenseImage'), async (req, res) => {
  try {
    const { email, password, ...doctorData } = req.body;

    if (!req.file) {
      throw new Error('License image is required - صورة الرخصة مطلوبة');
    }

    const result = await doctorService.registerWithEmail(
      { email, password, ...doctorData },
      req.file
    );

    res.status(201).json({
      message: 'Doctor registered successfully - تم تسجيل الطبيب بنجاح',
      ...result,
    });
  } catch (error) {
    logger.error('Doctor registration failed:', error);
    res.status(400).json({
      error: error.message || 'Registration failed - فشل التسجيل',
    });
  }
});

/**
 * @route POST /api/doctors/register/google
 * @desc Register a new doctor with Google authentication
 * تسجيل طبيب جديد باستخدام حساب جوجل
 * @param {Object} req.body - Doctor registration data
 * @param {File} req.file - License image file
 * @returns {Object} Registered doctor data with JWT token
 */
router.post('/register/google', upload.single('licenseImage'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('License image is required - صورة الرخصة مطلوبة');
    }

    const result = await doctorService.registerWithGoogle(req.body, req.file);

    res.status(201).json({
      message: 'Doctor registered successfully - تم تسجيل الطبيب بنجاح',
      ...result,
    });
  } catch (error) {
    logger.error('Doctor registration with Google failed:', error);
    res.status(400).json({
      error: error.message || 'Registration failed - فشل التسجيل',
    });
  }
});

/**
 * @route GET /api/doctors/search-patients
 * @desc Search for patients by various criteria
 * البحث عن المرضى باستخدام معايير مختلفة
 * @param {Object} req.query - Search parameters (email, phone, name)
 * @returns {Object} Search results with limited patient information
 * @requires Auth Active doctor status
 */
router.get('/search-patients', requireAuth, async (req, res) => {
  try {
    // التحقق من أن المستخدم طبيب نشط
    const doctorProfile = await doctorService.getDoctorProfile(req.user.uid);
    if (!doctorProfile || doctorProfile.status !== 'active') {
      throw new Error(
        'Unauthorized: Only active doctors can search for patients - غير مصرح به: فقط الأطباء النشطين يمكنهم البحث عن المرضى'
      );
    }

    const { email, phone, name } = req.query;
    if (!email && !phone && !name) {
      throw new Error(
        'At least one search parameter is required (email, phone, or name) - مطلوب معيار بحث واحد على الأقل (البريد الإلكتروني أو الهاتف أو الاسم)'
      );
    }

    const patients = await patientService.searchPatients({ email, phone, name });

    res.json({
      message: 'تم العثور على نتائج البحث بنجاح',
      count: patients.length,
      results: patients,
    });
  } catch (error) {
    logger.error('خطأ في البحث عن المرضى:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      error: error.message || 'فشل البحث عن المرضى',
    });
  }
});

/**
 * @route GET /api/doctors/profile
 * @desc Get doctor's professional profile
 * عرض الملف الشخصي للطبيب
 * @param {string} req.user.uid - Doctor ID from auth token
 * @returns {Object} Complete doctor profile
 * @requires Auth
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const doctorProfile = await doctorService.getDoctorProfile(req.user.uid);
    res.json(doctorProfile);
  } catch (error) {
    logger.error('Error fetching doctor profile:', error);
    res.status(404).json({
      error: error.message || 'Profile not found - الملف الشخصي غير موجود',
    });
  }
});

export default router;
logger