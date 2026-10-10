import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./auth.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    age: [18, [Validators.required, Validators.min(13), Validators.max(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
  isSubmitting = false;
  errorMessage = '';
  photoDataUrl = '';

  async takePhoto(): Promise<void> {
    this.errorMessage = '';

    try {
      const isNative = Capacitor.isNativePlatform();
      if (isNative) {
        await Camera.requestPermissions({ permissions: ['camera'] });
      }

      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: isNative ? CameraSource.Camera : CameraSource.Prompt,
      });

      if (photo.dataUrl) {
        this.photoDataUrl = photo.dataUrl;
      }
    } catch {
      this.errorMessage = Capacitor.isNativePlatform()
        ? 'La camera est indisponible ou son acces a ete refuse.'
        : 'Aucune photo n\'a ete selectionnee. Autorisez la camera ou choisissez une image.';
    }
  }

  async submit(): Promise<void> {
    this.errorMessage = '';
    this.form.markAllAsTouched();

    if (!this.photoDataUrl) {
      this.errorMessage = 'Veuillez prendre ou selectionner une photo pour creer votre compte.';
      return;
    }

    if (this.form.invalid) {
      return;
    }

    this.isSubmitting = true;
    try {
      await this.authService.register({
        ...this.form.getRawValue(),
        photoDataUrl: this.photoDataUrl,
      });
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      this.errorMessage = this.authService.getErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async goToLogin(): Promise<void> {
    await this.router.navigateByUrl('/auth/login');
  }
}
