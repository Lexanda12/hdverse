import { Request, Response, NextFunction } from 'express';
import { redis } from '../../lib/redis';
import { sendError } from '../utils/api-response';

export function rateLimiter(limit: number, durationSeconds: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const identifier = userId || req.ip || req.socket.remoteAddress || 'unknown';
      const key = `rate-limit:${req.baseUrl || ''}${req.path}:${identifier}`;

      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, durationSeconds);
      }

      if (current > limit) {
        sendError(res, 'TOO_MANY_REQUESTS', 'Too many requests. Please try again later.', 429);
        return;
      }

      next();
    } catch (err) {
      // Fail open if Redis is down, but log the error
      next();
    }
  };
}
