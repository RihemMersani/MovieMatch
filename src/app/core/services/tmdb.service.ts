import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Movie } from '../../models';

interface TmdbMovie {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date: string;
	vote_average: number;
	genres?: Array<{ id: number; name: string }>;
}

interface TmdbMovieResponse {
	results: TmdbMovie[];
}

@Injectable({ providedIn: 'root' })
export class TmdbService {
	private readonly http = inject(HttpClient);

	isConfigured(): boolean {
		return Boolean(environment.tmdb.apiKey && environment.tmdb.apiBaseUrl);
	}

	async getPopularMovies(page = 1): Promise<Movie[]> {
		const response = await this.request<TmdbMovieResponse>('/movie/popular', page);
		return response.results.map((movie) => this.toMovie(movie));
	}

	async searchMovies(searchTerm: string, page = 1): Promise<Movie[]> {
		const response = await this.request<TmdbMovieResponse>('/search/movie', page, searchTerm);
		return response.results.map((movie) => this.toMovie(movie));
	}

	async getMovieDetails(movieId: number): Promise<Movie> {
		const movie = await firstValueFrom(
			this.http.get<TmdbMovie>(`${environment.tmdb.apiBaseUrl}/movie/${movieId}`, {
				params: this.createParams(),
			}),
		);

		return this.toMovie(movie);
	}

	getImageUrl(path: string | null | undefined, size = 'w500'): string {
		if (!path) {
			return 'assets/movie-placeholder.svg';
		}

		return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/${size}${path}`;
	}

	private async request<T extends TmdbMovieResponse>(endpoint: string, page: number, searchTerm?: string): Promise<T> {
		let params = this.createParams().set('page', page);
		if (searchTerm) {
			params = params.set('query', searchTerm);
		}

		return firstValueFrom(
			this.http.get<T>(`${environment.tmdb.apiBaseUrl}${endpoint}`, { params }),
		);
	}

	private createParams(): HttpParams {
		return new HttpParams()
			.set('api_key', environment.tmdb.apiKey)
			.set('language', 'fr-FR');
	}

	private toMovie(movie: TmdbMovie): Movie {
		return {
			id: `tmdb-${movie.id}`,
			title: movie.title,
			overview: movie.overview,
			posterPath: movie.poster_path ?? '',
			backdropPath: movie.backdrop_path ?? undefined,
			releaseDate: movie.release_date,
			voteAverage: movie.vote_average,
			genres: movie.genres?.map((genre) => genre.name) ?? [],
			source: 'TMDB',
			tmdbId: movie.id,
		};
	}
}