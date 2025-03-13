/**
 * Authentication and authorization middleware
 * وحدة المصادقة والتفويض
 * @module middleware/auth
 */
import { UnauthorizedError, ForbiddenError } from './error.middleware.js';
import { firebaseService } from '../services/firebase.service.js';
import { firestoreService } from '../services/firestore.service.js';
import { logger } from '../utils/logger.js';

/**
 * Verifies Firebase authentication token
 * التحقق من صحة رمز المصادقة
 * @param {Request} req - Express request object
 * @param {Response} _res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {UnauthorizedError} If token is invalid or missing
 */
export const requireAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided - لم يتم توفير رمز المصادقة');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebaseService.getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Authentication error - خطأ في المصادقة:', error);
    next(new UnauthorizedError('Invalid token - رمز المصادقة غير صالح'));
  }
};

/**
 * Verifies user is a doctor with valid status
 * التحقق من أن المستخدم طبيب بحالة صالحة
 * @param {Request} req - Express request object
 * @param {Response} _res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {ForbiddenError} If user is not a doctor
 */
export const requireDoctor = async (req, _res, next) => {
  try {
    const doctorDoc = await firestoreService.getDoc('doctors', req.user.uid);
    if (!doctorDoc) {
      throw new ForbiddenError('Doctor access required - مطلوب صلاحيات طبيب');
    }
    req.doctor = doctorDoc;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies user is a patient
 * التحقق من أن المستخدم مريض
 * @param {Request} req - Express request object
 * @param {Response} _res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {ForbiddenError} If user is not a patient
 */
export const requirePatient = async (req, _res, next) => {
  try {
    const patientDoc = await firestoreService.getDoc('patients', req.user.uid);
    if (!patientDoc) {
      throw new ForbiddenError('Patient access required - مطلوب صلاحيات مريض');
    }
    req.patient = patientDoc;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies doctor has access to patient data
 * التحقق من صلاحية الطبيب للوصول إلى بيانات المريض
 * @param {Request} req - Express request object
 * @param {Response} _res - Express response object
 * @param {Function} next - Next middleware function
 * @throws {ForbiddenError} If doctor doesn't have permission
 */
export const requirePatientAccess = async (req, _res, next) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user.uid;

    const permissionDoc = await firestoreService.getDoc(
      `patients/${patientId}/permissions`,
      doctorId
    );

    if (!permissionDoc) {
      throw new ForbiddenError(
        'No access to patient data - لا يوجد صلاحية للوصول إلى بيانات المريض'
      );
    }

    req.permission = permissionDoc;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Adds rate limiting based on user type
 * إضافة حد للطلبات حسب نوع المستخدم
 * @param {number} doctorLimit - Rate limit for doctors
 * @param {number} patientLimit - Rate limit for patients
 * @returns {Function} Rate limiting middleware
 */
export const userRateLimit = (doctorLimit, patientLimit) => {
  return async (req, _res, next) => {
    try {
      // Apply different rate limits based on user type
      const doctorDoc = await firestoreService.getDoc('doctors', req.user.uid);
      req.rateLimit = doctorDoc ? doctorLimit : patientLimit;
      next();
    } catch (error) {
      next(error);
    }
  };
};
