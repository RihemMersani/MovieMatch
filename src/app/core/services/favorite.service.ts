import { Injectable } from '@angular/core';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';

import { auth, firestore } from '../firebase';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
	async getFavoriteIds(): Promise<string[]> {
		const user = auth?.currentUser;
		if (!user || !firestore) {
			return [];
		}

		const snapshot = await getDoc(doc(firestore, 'users', user.uid));
		return (snapshot.data()?.['favoriteMovieIds'] as string[] | undefined) ?? [];
	}

	async isFavorite(movieId: string): Promise<boolean> {
		const favoriteIds = await this.getFavoriteIds();
		return favoriteIds.includes(movieId);
	}

	async addFavorite(movieId: string): Promise<void> {
		await this.updateFavorites(arrayUnion(movieId));
	}

	async removeFavorite(movieId: string): Promise<void> {
		await this.updateFavorites(arrayRemove(movieId));
	}

	private async updateFavorites(operation: ReturnType<typeof arrayUnion>): Promise<void> {
		const user = auth?.currentUser;
		if (!user || !firestore) {
			throw new Error('FAVORITES_NOT_CONFIGURED');
		}

		await updateDoc(doc(firestore, 'users', user.uid), {
			favoriteMovieIds: operation,
		});
	}
}