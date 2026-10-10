import { Injectable } from '@angular/core';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { auth, firestore } from '../firebase';
import { UserProfile } from '../../models';

export interface ProfileUpdate {
	firstName: string;
	lastName: string;
	age: number;
	photoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
	async getCurrentProfile(): Promise<UserProfile | null> {
		const user = auth?.currentUser;

		if (!user || !firestore) {
			return null;
		}

		const profileSnapshot = await getDoc(doc(firestore, 'users', user.uid));
		if (!profileSnapshot.exists()) {
			return null;
		}

		return {
			id: profileSnapshot.id,
			...profileSnapshot.data(),
		} as UserProfile;
	}

	async updateCurrentProfile(data: ProfileUpdate): Promise<void> {
		const user = auth?.currentUser;

		if (!user || !firestore) {
			throw new Error('PROFILE_NOT_CONFIGURED');
		}

		await updateDoc(doc(firestore, 'users', user.uid), {
			...data,
			updatedAt: serverTimestamp(),
		});
	}
}