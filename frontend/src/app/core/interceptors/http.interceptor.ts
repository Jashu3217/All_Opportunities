import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  // Don't set Content-Type for file uploads — browser sets it with boundary automatically
  const isFileUpload = req.body instanceof FormData;

  const modifiedReq = isFileUpload ? req : req.clone({
    setHeaders: { 'Content-Type': 'application/json' },
  });

  return next(modifiedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const msg = err.error?.error || err.message || 'Network error';
      console.error(`HTTP ${err.status}: ${msg}`);
      return throwError(() => new Error(msg));
    })
  );
};
