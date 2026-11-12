import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app/app.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/logger/index.js';
import { prisma } from './infrastructure/database/prisma.client.js';
import { startOutboxDispatcher } from './workers/outbox-dispatcher/index.js';
import { startMqttIngestionWorker } from './workers/mqtt-ingestion/index.js';
import { setSocketIO } from './infrastructure/websocket/socket.server.js';

const startServer = async () => {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Lưu instance Socket.IO để toàn hệ thống (MQTT Ingestion, Alerts) có thể broadcast
  setSocketIO(io);

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Socket.IO client connected');

    socket.on('join:farm', ({ farmId }: { farmId: string }) => {
      if (farmId) {
        socket.join(`farm:${farmId}`);
        logger.info({ socketId: socket.id, farmId }, 'Client joined farm room');
      }
    });

    socket.on('join:room', (room: string) => {
      socket.join(room);
      logger.debug({ socketId: socket.id, room }, 'Client joined room');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket.IO client disconnected');
    });
  });

  // Start HTTP Listener
  server.listen(env.PORT, () => {
    logger.info(`🚀 Smart Agriculture API Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`📡 Health Check URL: http://localhost:${env.PORT}/health`);
    logger.info(`📚 Swagger UI API Docs: http://localhost:${env.PORT}/api-docs`);
    logger.info(`🔐 Auth API Base: http://localhost:${env.PORT}/api/v1/auth`);

    // 1. Khởi động Transactional Outbox Dispatcher Worker xử lý sự kiện cảnh báo và đẩy Push Notification
    startOutboxDispatcher().catch((err) => {
      logger.error(err, 'Outbox dispatcher worker encounter error');
    });

    // 2. Khởi động MQTT Ingestion Worker kết nối EMQX Broker để nhận dữ liệu từ ESP32 / Wokwi
    startMqttIngestionWorker().catch((err) => {
      logger.error(err, 'MQTT Ingestion worker encounter error');
    });

    // 1. Khởi động Transactional Outbox Dispatcher Worker xử lý sự kiện cảnh báo và đẩy Push Notification
    startOutboxDispatcher().catch((err) => {
      logger.error(err, 'Outbox dispatcher worker encounter error');
    });

    // 2. Khởi động MQTT Ingestion Worker kết nối EMQX Broker để nhận dữ liệu từ ESP32 / Wokwi
    startMqttIngestionWorker().catch((err) => {
      logger.error(err, 'MQTT Ingestion worker encounter error');
    });
  });

  // Graceful Shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down server...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error(err, 'Error during shutdown');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error(err, 'Fatal error during server startup');
  process.exit(1);
});

