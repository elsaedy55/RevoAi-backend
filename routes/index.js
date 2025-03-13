/**
 * API route configuration and setup
 * إعداد وتكوين مسارات API
 * @module routes
 */
import doctorRoutes from './doctor.routes.js';
import patientRoutes from './patient.routes.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { securityMiddleware } from '../middleware/security.middleware.js';

/**
 * Configure application routes and middleware
 * إعداد مسارات ووحدات التطبيق
 * @param {Express} app - Express application instance
 */
export const configureRoutes = app => {
  // Apply security middleware - تطبيق وحدات الأمان
  app.use(securityMiddleware);

  // Health check route - مسار فحص الحالة
  app.get('/health', (req, res) => res.status(200).json({ 
    status: 'healthy',
    message: 'System is operational - النظام يعمل'
  }));

  // API routes - مسارات API
  app.use('/api/doctors', asyncHandler(doctorRoutes));
  app.use('/api/patients', asyncHandler(patientRoutes));

  // 404 handler - معالج الصفحات غير الموجودة
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found - غير موجود',
      message: 'The requested resource was not found - المورد المطلوب غير موجود',
    });
  });
};
