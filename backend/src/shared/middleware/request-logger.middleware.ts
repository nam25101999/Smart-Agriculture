import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger/index.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  req.headers['x-trace-id'] = traceId;
  res.setHeader('x-trace-id', traceId);

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    logger.info({
      traceId,
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    }, `${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};

