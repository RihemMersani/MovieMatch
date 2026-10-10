import { Injectable } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { MatchResult, UserProfile } from '../../models';
import { auth, firestore } from '../firebase';

const MATCH_THRESHOLD = 75;

@Injectable({ providedIn: 'root' })
export class MatchingService {
	async getCompatibleUsers(threshold = MATCH_THRESHOLD): Promise<MatchResult[]> {
		const currentUserId = auth?.currentUser?.uid;
		if (!currentUserId || !firestore) {
			return [];
		}

		const usersSnapshot = await getDocs(
			query(collection(firestore, 'users'), where('isDisabled', '==', false)),
		);
		const users = usersSnapshot.docs.map((user) => ({
			id: user.id,
			...user.data(),
		}) as UserProfile);
		const currentUser = users.find((user) => user.id === currentUserId);

		if (!currentUser) {
			return [];
		}

		return users
			.filter((user) => user.id !== currentUserId)
			.map((user) => this.createMatchResult(currentUser, user))
			.filter((match) => match.matchScore >= threshold)
			.sort((left, right) => right.matchScore - left.matchScore);
	}

	calculateSimilarity(firstMovieIds: string[], secondMovieIds: string[]): number {
		const firstFavorites = new Set(firstMovieIds);
		const secondFavorites = new Set(secondMovieIds);
		const commonMovieCount = [...firstFavorites].filter((movieId) => secondFavorites.has(movieId)).length;
		const totalMovieCount = new Set([...firstFavorites, ...secondFavorites]).size;

		if (totalMovieCount === 0) {
			return 0;
		}

		return Math.round((commonMovieCount / totalMovieCount) * 100);
	}

	private createMatchResult(currentUser: UserProfile, candidate: UserProfile): MatchResult {
		const currentFavorites = currentUser.favoriteMovieIds ?? [];
		const candidateFavorites = candidate.favoriteMovieIds ?? [];

		return {
			user: candidate,
			matchScore: this.calculateSimilarity(currentFavorites, candidateFavorites),
			commonMovieIds: this.getCommonMovieIds(currentFavorites, candidateFavorites),
		};
	}

	private getCommonMovieIds(firstMovieIds: string[], secondMovieIds: string[]): string[] {
		const secondFavorites = new Set(secondMovieIds);
		return [...new Set(firstMovieIds)].filter((movieId) => secondFavorites.has(movieId));
	}
}
