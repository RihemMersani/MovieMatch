
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  catchError,
  from,
  map,
  of,
  switchMap,
  take,
} from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),

    switchMap((isAuthenticated) => {
      if (!isAuthenticated) {
        return of(
          router.createUrlTree(['/auth/login'])
        );
      }

      return from(
        authService.isCurrentUserActive()
      ).pipe(
        switchMap((isActive) => {
          if (isActive) {
            return of(true);
          }

          return from(authService.logout()).pipe(
            map(() =>
              router.createUrlTree(['/auth/login'])
            )
          );
        }),

        catchError(() =>
          of(router.createUrlTree(['/auth/login']))
        )
      );
    })
  );
};
