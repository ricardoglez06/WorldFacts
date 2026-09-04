import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || err.statusCode || 500;
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');
  if (status === 500) {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(status).json({ error: err.message || 'Error' });
  }
}
