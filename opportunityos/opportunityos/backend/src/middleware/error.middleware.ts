import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?:   string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ Error:', err.message, err.stack);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error:   err.message || 'Internal server error',
    code:    err.code    || 'INTERNAL_ERROR',
  });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success:false, error:'Route not found', code:'NOT_FOUND' });
}
