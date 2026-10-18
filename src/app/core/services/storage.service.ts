import { Injectable } from '@angular/core';

/** Prépare une photo JPEG compacte pour stockage dans Firestore, sans Firebase Storage. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly maxDimension = 320;
  private readonly maxDataUrlLength = 160_000;

  async prepareProfilePhoto(dataUrl: string): Promise<string> {
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('INVALID_PROFILE_IMAGE');
    }

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => reject(new Error('IMAGE_TIMEOUT')), 10000);
      img.onload = () => { clearTimeout(timeout); resolve(img); };
      img.onerror = () => { clearTimeout(timeout); reject(new Error('INVALID_PROFILE_IMAGE')); };
      img.src = dataUrl;
    });

    const scale = Math.min(1, this.maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('IMAGE_PROCESSING_FAILED');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.7, 0.55, 0.4]) {
      const compressed = canvas.toDataURL('image/jpeg', quality);
      if (compressed.length <= this.maxDataUrlLength) return compressed;
    }
    throw new Error('PROFILE_IMAGE_TOO_LARGE');
  }
}
