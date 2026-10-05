import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, of, switchMap, take } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	return authService.isAuthenticated$.pipe(
		take(1),
		switchMap((isAuthenticated) => {
			if (!isAuthenticated) {
				return of(router.createUrlTree(['/auth/login']));
			}

			return from(authService.getCurrentProfile()).pipe(
				map((profile) => profile?.role === 'ADMIN' || router.createUrlTree(['/home'])),
			);
		}),
	);
};