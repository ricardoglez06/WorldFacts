import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      console.error(`[HTTP] ${req.method} ${req.url}`, error?.status ?? '', error?.message ?? error);
      return throwError(() => error);
    })
  );
};
