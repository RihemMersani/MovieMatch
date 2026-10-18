import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { FavoriteService } from '../core/services/favorite.service';
import { MatchingService } from '../core/services/matching.service';
import { MovieService } from '../core/services/movie.service';
import { Movie } from '../models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly matchingService = inject(MatchingService);
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);
  firstName = 'Cinéphile';
  favoriteCount = 0;
  matchCount = 0;
  movies: Movie[] = [];
  isLoading = true;

  async ngOnInit(): Promise<void> { await this.loadHome(); }

  async loadHome(): Promise<void> {
    this.isLoading = true;
    try {
      const profile = await this.authService.getCurrentProfile();
      if (profile?.role === 'ADMIN') {
        await this.router.navigateByUrl('/admin', { replaceUrl: true });
        return;
      }
      this.firstName = profile?.firstName?.trim() || 'Cinéphile';
      const [favorites, matches, movies] = await Promise.allSettled([
        this.favoriteService.getFavoriteIds(),
        this.matchingService.getCompatibleUsers(),
        this.movieService.getMovies(),
      ]);
      this.favoriteCount = favorites.status === 'fulfilled' ? favorites.value.length : 0;
      this.matchCount = matches.status === 'fulfilled' ? matches.value.length : 0;
      this.movies = movies.status === 'fulfilled' ? movies.value.slice(0, 4) : [];
    } catch (error) {
      console.error('Chargement de l’accueil :', error);
    } finally { this.isLoading = false; }
  }

  poster(movie: Movie): string { return this.movieService.getPosterUrl(movie); }
  async logout(): Promise<void> { await this.authService.logout(); await this.router.navigateByUrl('/auth/login', { replaceUrl: true }); }
  async openProfile(): Promise<void> { await this.router.navigateByUrl('/profile'); }
  async openMovies(): Promise<void> { await this.router.navigateByUrl('/movies'); }
  async openMovie(movie: Movie): Promise<void> { await this.router.navigateByUrl('/movies/' + encodeURIComponent(movie.id)); }
  async openFavorites(): Promise<void> { await this.router.navigateByUrl('/favorites'); }
  async openMatches(): Promise<void> { await this.router.navigateByUrl('/matches'); }
}
