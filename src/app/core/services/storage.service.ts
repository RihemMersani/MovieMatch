import { Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '../firebase';

@Injectable({ providedIn: 'root' })
export class StorageService {
	async uploadProfilePhoto(userId: string, dataUrl: string): Promise<string> {
		if (!storage) {
			throw new Error('STORAGE_NOT_CONFIGURED');
		}

		const response = await fetch(dataUrl);
		const blob = await response.blob();
		const photoReference = ref(storage, `profile-photos/${userId}/profile.jpg`);

		await uploadBytes(photoReference, blob, {
			contentType: blob.type || 'image/jpeg',
		});

		return getDownloadURL(photoReference);
	}
}