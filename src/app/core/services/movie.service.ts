import { Injectable } from '@angular/core';
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from 'firebase/firestore';

import { Movie } from '../../models';
import { firestore } from '../firebase';
import { TmdbService } from './tmdb.service';

@Injectable({ providedIn: 'root' })
export class MovieService {
	constructor(private readonly tmdbService: TmdbService) {}

	async getMovies(searchTerm = '', page = 1): Promise<Movie[]> {
		if (this.tmdbService.isConfigured()) {
			try {
				return searchTerm.trim()
					? await this.tmdbService.searchMovies(searchTerm.trim(), page)
					: await this.tmdbService.getPopularMovies(page);
			} catch {
				return this.getFirestoreMovies();
			}
		}

		return this.getFirestoreMovies();
	}

	async getMovieById(id: string): Promise<Movie | null> {
		if (id.startsWith('tmdb-') && this.tmdbService.isConfigured()) {
			try {
				return await this.tmdbService.getMovieDetails(Number(id.replace('tmdb-', '')));
			} catch {
				return null;
			}
		}

		if (!firestore) {
			return null;
		}

		const snapshot = await getDoc(doc(firestore, 'movies', id));
		return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Movie) : null;
	}

	getPosterUrl(movie: Movie): string {
		return this.tmdbService.getImageUrl(movie.posterPath, 'w500');
	}

	getBackdropUrl(movie: Movie): string {
		return this.tmdbService.getImageUrl(movie.backdropPath, 'w1280');
	}

	async getMoviesByIds(ids: string[]): Promise<Movie[]> {
		const movies = await Promise.all(ids.map((id) => this.getMovieById(id)));
		return movies.filter((movie): movie is Movie => movie !== null);
	}

	private async getFirestoreMovies(): Promise<Movie[]> {
		if (!firestore) {
			return [];
		}

		const moviesQuery = query(collection(firestore, 'movies'), orderBy('title'), limit(40));
		const snapshot = await getDocs(moviesQuery);
		return snapshot.docs.map((movie) => ({ id: movie.id, ...movie.data() }) as Movie);
	}
}