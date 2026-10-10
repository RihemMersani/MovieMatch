import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
  },
  {
    path: 'movies',
    canActivate: [authGuard],
    loadComponent: () => import('./movies/movies.page').then((m) => m.MoviesPage),
  },
  {
    path: 'movies/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./movie-details/movie-details.page').then((m) => m.MovieDetailsPage),
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () => import('./favorites/favorites.page').then((m) => m.FavoritesPage),
  },
  {
    path: 'matches',
    canActivate: [authGuard],
    loadComponent: () => import('./matches/matches.page').then((m) => m.MatchesPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
];
