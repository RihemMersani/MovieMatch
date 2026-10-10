import { Injectable } from '@angular/core';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	serverTimestamp,
	updateDoc,
} from 'firebase/firestore';

import { Movie, UserProfile } from '../../models';
import { firestore } from '../firebase';

export interface AdminStats {
	totalUsers: number;
	activeUsers: number;
	disabledUsers: number;
	totalMovies: number;
	manualMovies: number;
	tmdbMovies: number;
	totalFavorites: number;
}

export interface AdminMovieInput {
	title: string;
	overview: string;
	posterPath: string;
	backdropPath?: string;
	releaseDate: string;
	voteAverage: number;
	genres: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
	async getDashboard(): Promise<{ stats: AdminStats; users: UserProfile[]; movies: Movie[] }> {
		if (!firestore) {
			throw new Error('ADMIN_NOT_CONFIGURED');
		}

		const [users, movies] = await Promise.all([
			this.getUsers(),
			this.getMovies(),
		]);

		return {
			stats: this.createStats(users, movies),
			users,
			movies,
		};
	}

	async getUsers(): Promise<UserProfile[]> {
		if (!firestore) {
			throw new Error('ADMIN_NOT_CONFIGURED');
		}

		const snapshot = await getDocs(collection(firestore, 'users'));
		return snapshot.docs
			.map((user) => ({ id: user.id, ...user.data() }) as UserProfile)
			.sort((left, right) => `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`));
	}

	async getMovies(): Promise<Movie[]> {
		if (!firestore) {
			throw new Error('ADMIN_NOT_CONFIGURED');
		}

		const snapshot = await getDocs(collection(firestore, 'movies'));
		return snapshot.docs
			.map((movie) => ({ id: movie.id, ...movie.data() }) as Movie)
			.sort((left, right) => left.title.localeCompare(right.title));
	}

	async setUserDisabled(userId: string, isDisabled: boolean): Promise<void> {
		if (!firestore) {
			throw new Error('ADMIN_NOT_CONFIGURED');
		}

		await updateDoc(doc(firestore, 'users', userId), {
			isDisabled,
			updatedAt: serverTimestamp(),
		});
	}

	async addMovie(movie: AdminMovieInput): Promise<void> {
		if (!firestore) {
			throw new Error('ADMIN_NOT_CONFIGURED');
		}

		await addDoc(collection(firestore, 'movies'), {
			...movie,
			source: 'MANUAL',
			tmdbId: null,
			createdAt: serverTimestamp(),
		});
	}

	async deleteMovie(movieId: string): Promise<void> {
		if (!firestore) {
			throw new Error('ADMIN_NOT_CONFIGURED');
		}

		await deleteDoc(doc(firestore, 'movies', movieId));
	}

	private createStats(users: UserProfile[], movies: Movie[]): AdminStats {
		return {
			totalUsers: users.length,
			activeUsers: users.filter((user) => !user.isDisabled).length,
			disabledUsers: users.filter((user) => user.isDisabled).length,
			totalMovies: movies.length,
			manualMovies: movies.filter((movie) => movie.source === 'MANUAL').length,
			tmdbMovies: movies.filter((movie) => movie.source === 'TMDB').length,
			totalFavorites: users.reduce((count, user) => count + (user.favoriteMovieIds?.length ?? 0), 0),
		};
	}
}
