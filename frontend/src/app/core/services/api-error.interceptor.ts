import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ApiErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = this.buildMessage(error);

        return throwError(() => ({
          ...error,
          error: {
            ...(typeof error.error === 'object' && error.error ? error.error : {}),
            message
          }
        }));
      })
    );
  }

  private buildMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.status === 0) {
      return 'Unable to reach the server. Please make sure both frontend and backend are running.';
    }

    if (error.status === 401) {
      return 'Your session has expired or your login details are invalid.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform that action.';
    }

    if (error.status === 404) {
      return 'The requested resource could not be found.';
    }

    if (error.status >= 500) {
      return 'The server ran into a problem. Please try again.';
    }

    return 'Something went wrong. Please try again.';
  }
}
