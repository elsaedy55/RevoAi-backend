/**
 * Main application entry point
 * نقطة الدخول الرئيسية للتطبيق
 * @module app
 */
import express from 'express';
import cors from 'cors';
import { initializeServices, setupAuthStateObserver } from './config/setup.js';
import { errorHandler } from './middleware/error.middleware.js';
import { configureRoutes } from './routes/index.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3000;

/**
 * Main application class
 * الفئة الرئيسية للتطبيق
 */
class Application {
  /**
   * Initialize Express application with middleware and routes
   * تهيئة تطبيق Express مع الوحدات والمسارات
   */
  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  /**
   * Configure application middleware
   * إعداد وحدات التطبيق
   */
  configureMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Configure API routes
   * إعداد مسارات API
   */
  configureRoutes() {
    configureRoutes(this.app);
  }

  /**
   * Configure global error handling
   * إعداد معالجة الأخطاء العامة
   */
  configureErrorHandling() {
    this.app.use(errorHandler);
  }

  /**
   * Start the application server
   * بدء تشغيل خادم التطبيق
   */
  async start() {
    try {
      // Initialize Firebase services - تهيئة خدمات Firebase
      await initializeServices();
      // Set up authentication observer - إعداد مراقب المصادقة
      setupAuthStateObserver();

      this.app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} - الخادم يعمل على المنفذ ${PORT}`);
      });
    } catch (error) {
      logger.error('Application initialization failed - فشل تهيئة التطبيق', error);
      process.exit(1);
    }
  }
}

// Create and start application instance - إنشاء وتشغيل نسخة التطبيق
const app = new Application();
app.start();
