import type { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../services/auth-service.js';
import type { TenantConfig } from '../types/domain.js';

export type TenantRequest = Request & { tenant?: TenantConfig | undefined };

export function apiKeyAuth(authService: AuthService) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const apiKey = req.header('x-api-key') ?? undefined;
      (req as TenantRequest).tenant = authService.authenticate(apiKey);
      next();
    } catch (error) {
      next(error);
    }
  };
}
