import { Request, Response, NextFunction } from 'express';

export function trackTiming(req: Request, res: Response, next: NextFunction): void {
  req.startTime = Date.now();
  next();
}
