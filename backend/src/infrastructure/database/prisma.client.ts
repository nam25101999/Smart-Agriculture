import { PrismaClient } from '@prisma/client';
import { logger } from '../../shared/logger/index.js';

class DatabaseClient {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Optional: attach query logger in debug mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DatabaseClient.instance as any).$on('error', (e: any) => {
        logger.error(e, 'Prisma Client Error');
      });
    }

    return DatabaseClient.instance;
  }
}

export const prisma = DatabaseClient.getInstance();

