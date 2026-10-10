import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonImg,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Movie } from '../models';
import { MovieService } from '../core/services/movie.service';
import { FavoriteService } from '../core/services/favorite.service';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.page.html',
  styleUrls: ['./movie-details.page.scss'],
  imports: [DecimalPipe, IonBackButton, IonButtons, IonContent, IonHeader, IonImg, IonSpinner, IonText, IonTitle, IonToolbar, IonButton],
})
export class MovieDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly movieService = inject(MovieService);
  private readonly favoriteService = inject(FavoriteService);

  movie: Movie | null = null;
  isLoading = true;
  errorMessage = '';
  isFavorite = false;
  favoriteMessage = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Film introuvable.';
      this.isLoading = false;
      return;
    }

    try {
      this.movie = await this.movieService.getMovieById(id);
      if (!this.movie) {
        this.errorMessage = 'Film introuvable.';
      } else {
        this.isFavorite = await this.favoriteService.isFavorite(this.movie.id);
      }
    } catch {
      this.errorMessage = 'Impossible de charger les détails du film.';
    } finally {
      this.isLoading = false;
    }
  }

  posterUrl(movie: Movie): string {
    return this.movieService.getPosterUrl(movie);
  }

  backdropUrl(movie: Movie): string {
    return this.movieService.getBackdropUrl(movie);
  }

  async toggleFavorite(): Promise<void> {
    if (!this.movie) {
      return;
    }

    try {
      if (this.isFavorite) {
        await this.favoriteService.removeFavorite(this.movie.id);
        this.isFavorite = false;
        this.favoriteMessage = 'Retiré de vos favoris.';
      } else {
        await this.favoriteService.addFavorite(this.movie.id);
        this.isFavorite = true;
        this.favoriteMessage = 'Ajouté à vos favoris.';
      }
    } catch {
      this.favoriteMessage = 'Impossible de modifier vos favoris.';
    }
  }
}