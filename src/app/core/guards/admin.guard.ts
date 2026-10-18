
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const isAuthenticated = await firstValueFrom(
      authService.isAuthenticated$
    );

    // Vérifier la connexion
    if (!isAuthenticated) {
      await router.navigateByUrl('/auth/login');
      return false;
    }

    // Charger le profil depuis Firestore
    const profile =
      await authService.getCurrentProfile();

    // Refuser les comptes absents ou désactivés
    if (!profile || profile.isDisabled !== false) {
      await authService.logout();
      await router.navigateByUrl('/auth/login');
      return false;
    }

    // Vérifier le rôle administrateur
    if (profile.role !== 'ADMIN') {
      await router.navigateByUrl('/home');
      return false;
    }

    // Autoriser l'accès au dashboard admin
    return true;

  } catch (error) {
    console.error(
      'Erreur de vérification du rôle administrateur :',
      error
    );

    await router.navigateByUrl('/auth/login');
    return false;
  }
};
