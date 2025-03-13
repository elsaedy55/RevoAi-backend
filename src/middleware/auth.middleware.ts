import { Request, Response, NextFunction } from 'express';
import { firestoreService } from '../../services/firestore.service.js';
import { UnauthorizedError, ForbiddenError } from '../../middleware/error.middleware.js';

interface CustomRequest extends Request {
  user?: { uid: string };
  admin?: any;
}

/**
 * Check if user has admin role
 * التحقق من صلاحيات المسؤول
 */
export const isAdmin = async (req: CustomRequest, _res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const adminDoc = await firestoreService.getDoc('admins', userId);
    if (!adminDoc || !adminDoc.isActive) {
      throw new ForbiddenError('Admin access required - مطلوب صلاحيات المسؤول');
    }

    req.admin = adminDoc;
    next();
  } catch (error) {
    next(error);
  }
};