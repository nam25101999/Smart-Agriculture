import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from '../shared/config/env.js';
import { requestLogger } from '../shared/middleware/request-logger.middleware.js';
import { errorHandler } from '../shared/middleware/error-handler.middleware.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '../infrastructure/docs/swagger.config.js';
import { authRoutes } from '../modules/auth/presentation/auth.routes.js';
import { userRoutes } from '../modules/users/presentation/user.routes.js';
import { farmRoutes } from '../modules/farms/presentation/farm.routes.js';
import { deviceRoutes } from '../modules/devices/presentation/device.routes.js';
import { telemetryRoutes } from '../modules/telemetry/presentation/telemetry.routes.js';
import { alertRoutes } from '../modules/alerts/presentation/alert.routes.js';
import { automationRoutes } from '../modules/automation/presentation/automation.routes.js';
import { notificationRoutes } from '../modules/notifications/presentation/notification.routes.js';
import { dashboardRoutes, analyticsRoutes } from '../modules/analytics/presentation/analytics.routes.js';
import { ResponseUtil } from '../shared/response/api-response.js';

export const createApp = (): Express => {
  const app = express();

  // Security & standard middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (req, res) => {
    ResponseUtil.success(
      res,
      {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: 'Smart Agriculture Backend',
        version: '1.0.0',
      },
      'Hệ thống đang hoạt động bình thường'
    );
  });

  // Swagger UI Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // REST API v1 Routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/users', userRoutes);
  apiV1.use('/farms', farmRoutes);
  apiV1.use('/devices', deviceRoutes);
  apiV1.use('/telemetry', telemetryRoutes);
  apiV1.use('/alerts', alertRoutes);
  apiV1.use('/automation', automationRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/dashboard', dashboardRoutes);
  apiV1.use('/analytics', analyticsRoutes);

  app.use('/api/v1', apiV1);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống`,
      error: { code: 'ROUTE_NOT_FOUND' },
      meta: { timestamp: new Date().toISOString() },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
