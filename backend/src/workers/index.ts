import { startMqttIngestionWorker } from './mqtt-ingestion/index.js';
import { startOutboxDispatcher } from './outbox-dispatcher/index.js';
import { logger } from '../shared/logger/index.js';

const startAllWorkers = async (): Promise<void> => {
  logger.info('===============================================');
  logger.info('🚜 STARTING ALL SMART AGRICULTURE WORKERS 🚜');
  logger.info('===============================================');

  // Start workers concurrently
  await Promise.all([
    startMqttIngestionWorker(),
    startOutboxDispatcher(),
  ]);
};

startAllWorkers().catch((err) => {
  logger.error(err, 'Failed to start background workers');
  process.exit(1);
});

