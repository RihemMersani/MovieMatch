
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const isAuthenticated = await firstValueFrom(
      authService.isAuthenticated$
    );

    // Si l'utilisateur n'est pas connecté
    if (!isAuthenticated) {
      await router.navigateByUrl('/auth/login');
      return false;
    }

    // Vérifier que le compte n'est pas désactivé
    const isActive =
      await authService.isCurrentUserActive();

    if (!isActive) {
      await authService.logout();
      await router.navigateByUrl('/auth/login');
      return false;
    }

    // Autoriser l'accès
    return true;

  } catch (error) {
    console.error(
      'Erreur de vérification de session :',
      error
    );

    await router.navigateByUrl('/auth/login');
    return false;
  }
};
