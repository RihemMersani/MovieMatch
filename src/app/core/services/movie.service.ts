
import { Injectable } from '@angular/core';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

import { Movie } from '../../models';
import { firestore } from '../firebase';
import { TmdbService } from './tmdb.service';

@Injectable({
  providedIn: 'root',
})
export class MovieService {

  constructor(
    private readonly tmdbService: TmdbService
  ) {}

  // Fusionner les films TMDB et Firestore
  async getMovies(
    searchTerm = '',
    page = 1
  ): Promise<Movie[]> {

    const search = searchTerm.trim();

    let tmdbMovies: Movie[] = [];
    let firestoreMovies: Movie[] = [];

    let tmdbFailed = false;
    let firestoreFailed = false;

    // 1. Charger les films depuis TMDB
    if (this.tmdbService.isConfigured()) {

      try {

        tmdbMovies = search
          ? await this.tmdbService.searchMovies(search, page)
          : await this.tmdbService.getPopularMovies(page);

      } catch (error) {

        console.error(
          'Erreur lors du chargement TMDB :',
          error
        );

        tmdbFailed = true;
      }

    }

    // 2. Charger les films ajoutés dans Firestore
    try {

      firestoreMovies = await this.getFirestoreMovies();

    } catch (error) {

      console.error(
        'Erreur lors du chargement Firestore :',
        error
      );

      firestoreFailed = true;
    }

    // 3. Appliquer la recherche aux films Firestore
    if (search) {

      const normalizedSearch = search.toLowerCase();

      firestoreMovies = firestoreMovies.filter(
        (movie) =>
          movie.title
            .toLowerCase()
            .includes(normalizedSearch)
      );
    }

    // 4. Signaler une erreur si aucune source
    // n'est accessible
    if (
      firestoreFailed &&
      (
        !this.tmdbService.isConfigured() ||
        tmdbFailed
      )
    ) {

      throw new Error(
        'Impossible de charger les catalogues.'
      );
    }

    // 5. Fusionner les deux catalogues
    const allMovies = [
      ...firestoreMovies,
      ...tmdbMovies,
    ];

    // 6. Supprimer les doublons
    const uniqueMovies = new Map<string, Movie>();

    for (const movie of allMovies) {

      const key = movie.tmdbId != null
        ? `tmdb-${movie.tmdbId}`
        : movie.id;

      if (!uniqueMovies.has(key)) {
        uniqueMovies.set(key, movie);
      }

    }

    return Array.from(uniqueMovies.values());
  }

  // Récupérer les détails d'un film
  async getMovieById(
    id: string
  ): Promise<Movie | null> {

    // Film provenant de TMDB
    if (
      id.startsWith('tmdb-') &&
      this.tmdbService.isConfigured()
    ) {

      try {

        const movieId = Number(
          id.replace('tmdb-', '')
        );

        if (!Number.isInteger(movieId) || movieId <= 0) {
          return null;
        }

        return await this.tmdbService.getMovieDetails(
          movieId
        );

      } catch (error) {

        console.error(
          'Erreur détails TMDB :',
          error
        );

        return null;
      }
    }

    // Film provenant de Firestore
    if (!firestore) {
      return null;
    }

    const snapshot = await getDoc(
      doc(firestore, 'movies', id)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as Movie;
  }

  // Affiche du film
  getPosterUrl(movie: Movie): string {

    return this.tmdbService.getImageUrl(
      movie.posterPath,
      'w500'
    );
  }

  // Image de couverture
  getBackdropUrl(movie: Movie): string {

    return this.tmdbService.getImageUrl(
      movie.backdropPath,
      'w1280'
    );
  }

  // Récupérer plusieurs films par identifiant
  async getMoviesByIds(
    ids: string[]
  ): Promise<Movie[]> {

    const movies = await Promise.all(
      ids.map((id) => this.getMovieById(id))
    );

    return movies.filter(
      (movie): movie is Movie =>
        movie !== null
    );
  }

  // Charger les films stockés dans Firestore
  private async getFirestoreMovies(): Promise<Movie[]> {

    if (!firestore) {
      return [];
    }

    const moviesQuery = query(
      collection(firestore, 'movies'),
      orderBy('title'),
      limit(100)
    );

    const snapshot = await getDocs(moviesQuery);

    return snapshot.docs.map((movie) => ({
      id: movie.id,
      ...movie.data(),
    } as Movie));
  }
}
