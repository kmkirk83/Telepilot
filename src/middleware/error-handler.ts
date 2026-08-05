import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../infra/errors.js';

export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction) {
  void next;
  const correlationId = req.header('x-correlation-id');
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? null,
        correlationId
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error',
      correlationId
    }
  });
}
