import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logger/index.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const traceId = (res.getHeader('x-trace-id') as string) || (req.headers['x-trace-id'] as string) || 'unknown';

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
      rule: e.code,
    }));

    logger.warn({ traceId, errors: formattedErrors }, 'Validation error');

    res.status(422).json({
      success: false,
      message: 'Dữ liệu đầu vào không hợp lệ',
      error: {
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
      },
    });
    return;
  }

  // 2. Custom Domain / Application AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ traceId, err }, err.message);
    } else {
      logger.warn({ traceId, code: err.code, details: err.details }, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: {
        code: err.code,
        details: err.details || null,
      },
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
      },
    });
    return;
  }

  // 3. Unhandled Server Errors (500)
  logger.error({ traceId, err }, `Unhandled exception: ${err.message}`);

  res.status(500).json({
    success: false,
    message: 'Lỗi xử lý nội bộ của máy chủ',
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
      traceId,
    },
  });
};

