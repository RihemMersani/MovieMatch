import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonImg,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Movie } from '../models';
import { FavoriteService } from '../core/services/favorite.service';
import { MovieService } from '../core/services/movie.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
  imports: [DecimalPipe, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonImg, IonSpinner, IonText, IonTitle, IonToolbar],
})
export class FavoritesPage implements OnInit {
  private readonly favoriteService = inject(FavoriteService);
  private readonly movieService = inject(MovieService);
  private readonly router = inject(Router);

  movies: Movie[] = [];
  isLoading = true;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.loadFavorites();
  }

  async removeFavorite(movie: Movie): Promise<void> {
    try {
      await this.favoriteService.removeFavorite(movie.id);
      this.movies = this.movies.filter((item) => item.id !== movie.id);
    } catch {
      this.errorMessage = 'Impossible de retirer ce film des favoris.';
    }
  }

  async openDetails(movie: Movie): Promise<void> {
    await this.router.navigate(['/movies', movie.id]);
  }

  posterUrl(movie: Movie): string {
    return this.movieService.getPosterUrl(movie);
  }

  private async loadFavorites(): Promise<void> {
    this.isLoading = true;
    try {
      const ids = await this.favoriteService.getFavoriteIds();
      this.movies = await this.movieService.getMoviesByIds(ids);
    } catch {
      this.errorMessage = 'Impossible de charger vos favoris.';
    } finally {
      this.isLoading = false;
    }
  }
}