import * as PrismaPkg from '@prisma/client';
import { logger } from '../../shared/logger/index.js';

const PrismaClientConstructor: any =
  (PrismaPkg as any).PrismaClient ||
  (PrismaPkg as any).default?.PrismaClient ||
  (PrismaPkg as any).default;

class DatabaseClient {
  private static instance: any;

  public static getInstance(): any {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClientConstructor({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // Optional: attach query logger in debug mode
      (DatabaseClient.instance as any).$on?.('error', (e: any) => {
        logger.error(e, 'Prisma Client Error');
      });
    }

    return DatabaseClient.instance;
  }
}

export const prisma: any = DatabaseClient.getInstance();

