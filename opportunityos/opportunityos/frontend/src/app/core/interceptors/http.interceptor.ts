import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const modifiedReq = req.clone({
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
