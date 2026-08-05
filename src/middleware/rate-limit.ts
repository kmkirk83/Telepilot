import type { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../infra/errors.js';

export function createRateLimiter(windowMs: number, maxRequests: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const existing = hits.get(key);

    if (!existing || existing.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      next(new RateLimitError());
      return;
    }

    existing.count += 1;
    next();
  };
}
