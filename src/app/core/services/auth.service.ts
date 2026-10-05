import { Injectable } from '@angular/core';
import {
	AuthError,
	User,
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
} from 'firebase/auth';
import {
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
} from 'firebase/firestore';
import { BehaviorSubject, Observable, combineLatest, filter, from, map, take } from 'rxjs';

import { auth, firestore } from '../firebase';
import { UserProfile } from '../../models';

export interface RegistrationData {
	firstName: string;
	lastName: string;
	age: number;
	email: string;
	password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly currentUserSubject = new BehaviorSubject<User | null>(auth?.currentUser ?? null);
	private readonly authReadySubject = new BehaviorSubject<boolean>(auth === null);

	readonly currentUser$ = this.currentUserSubject.asObservable();
	readonly authReady$ = this.authReadySubject.asObservable();
	readonly isAuthenticated$: Observable<boolean> = combineLatest([
		this.currentUser$,
		this.authReady$,
	]).pipe(
		filter(([, ready]) => ready),
		map(([user]) => user !== null),
	);

	constructor() {
		if (auth) {
			onAuthStateChanged(auth, (user) => {
				this.currentUserSubject.next(user);
				this.authReadySubject.next(true);
			});
		}
	}

	async register(data: RegistrationData): Promise<void> {
		this.ensureFirebaseConfiguration();

		const credential = await createUserWithEmailAndPassword(auth!, data.email, data.password);

		if (firestore) {
			const profile: Omit<UserProfile, 'id' | 'createdAt'> = {
				firstName: data.firstName,
				lastName: data.lastName,
				age: data.age,
				email: data.email,
				photoUrl: '',
				role: 'USER',
				isDisabled: false,
				favoriteMovieIds: [],
			};

			await setDoc(doc(firestore, 'users', credential.user.uid), {
				...profile,
				createdAt: serverTimestamp(),
			});
		}
	}

	async login(email: string, password: string): Promise<void> {
		this.ensureFirebaseConfiguration();
		const credential = await signInWithEmailAndPassword(auth!, email, password);

		if (firestore) {
			const profileSnapshot = await getDoc(doc(firestore, 'users', credential.user.uid));
			const profile = profileSnapshot.data() as Partial<UserProfile> | undefined;

			if (profile?.isDisabled) {
				await this.logout();
				throw new Error('ACCOUNT_DISABLED');
			}
		}
	}

	async logout(): Promise<void> {
		if (auth) {
			await signOut(auth);
		}
	}

	async getCurrentProfile(): Promise<UserProfile | null> {
		const user = this.currentUserSubject.value;

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

	getUserOnce(): Observable<User | null> {
		return this.isAuthenticated$.pipe(
			take(1),
			map(() => this.currentUserSubject.value),
		);
	}

	getErrorMessage(error: unknown): string {
		if (error instanceof Error && error.message.startsWith('Firebase n’est pas encore configuré')) {
			return 'Firebase n’est pas encore configuré. Renseignez la configuration du projet pour créer un compte.';
		}

		if (error instanceof Error && error.message === 'ACCOUNT_DISABLED') {
			return 'Ce compte a été désactivé. Contactez un administrateur.';
		}

		const code = (error as AuthError | undefined)?.code;
		switch (code) {
			case 'auth/invalid-credential':
			case 'auth/wrong-password':
				return 'Email ou mot de passe incorrect.';
			case 'auth/email-already-in-use':
				return 'Cette adresse email est déjà utilisée.';
			case 'auth/invalid-email':
				return 'Veuillez saisir une adresse email valide.';
			case 'auth/weak-password':
				return 'Le mot de passe doit contenir au moins 6 caractères.';
			default:
				return 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
		}
	}

	private ensureFirebaseConfiguration(): void {
		if (!auth) {
			throw new Error('Firebase n’est pas encore configuré.');
		}
	}
}