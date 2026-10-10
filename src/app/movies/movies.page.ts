import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Movie } from '../models';
import { MovieService } from '../core/services/movie.service';
import { FavoriteService } from '../core/services/favorite.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.page.html',
  styleUrls: ['./movies.page.scss'],
  imports: [
    DecimalPipe,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonImg,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class MoviesPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly movieService = inject(MovieService);
  private readonly favoriteService = inject(FavoriteService);
  private readonly router = inject(Router);

  readonly searchForm = this.formBuilder.nonNullable.group({ search: [''] });
  movies: Movie[] = [];
  isLoading = true;
  errorMessage = '';
  favoriteIds = new Set<string>();

  async ngOnInit(): Promise<void> {
    await this.loadMovies();
    await this.loadFavorites();
  }

  async search(): Promise<void> {
    await this.loadMovies(this.searchForm.controls.search.value);
  }

  async openDetails(movie: Movie): Promise<void> {
    await this.router.navigate(['/movies', movie.id]);
  }

  async toggleFavorite(movie: Movie, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      if (this.favoriteIds.has(movie.id)) {
        await this.favoriteService.removeFavorite(movie.id);
        this.favoriteIds.delete(movie.id);
      } else {
        await this.favoriteService.addFavorite(movie.id);
        this.favoriteIds.add(movie.id);
      }
      this.favoriteIds = new Set(this.favoriteIds);
    } catch {
      this.errorMessage = 'Impossible de modifier vos favoris. Vérifiez Firebase.';
    }
  }

  isFavorite(movie: Movie): boolean {
    return this.favoriteIds.has(movie.id);
  }

  posterUrl(movie: Movie): string {
    return this.movieService.getPosterUrl(movie);
  }

  private async loadMovies(searchTerm = ''): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.movies = await this.movieService.getMovies(searchTerm);
    } catch {
      this.errorMessage = 'Impossible de charger les films. Vérifiez votre connexion.';
    } finally {
      this.isLoading = false;
    }
  }

  private async loadFavorites(): Promise<void> {
    try {
      this.favoriteIds = new Set(await this.favoriteService.getFavoriteIds());
    } catch {
      this.favoriteIds = new Set();
    }
  }
}