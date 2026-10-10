import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { StorageService } from '../core/services/storage.service';
import { UserService } from '../core/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
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
export class ProfilePage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    age: [18, [Validators.required, Validators.min(13), Validators.max(120)]],
  });

  photoUrl = '';
  selectedPhoto = '';
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  async ngOnInit(): Promise<void> {
    try {
      const profile = await this.userService.getCurrentProfile();
      if (profile) {
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          age: profile.age,
        });
        this.photoUrl = profile.photoUrl;
      }
    } catch {
      this.errorMessage = 'Impossible de charger votre profil.';
    } finally {
      this.isLoading = false;
    }
  }

  async takePhoto(): Promise<void> {
    this.errorMessage = '';

    try {
      await Camera.requestPermissions({ permissions: ['camera'] });
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (photo.dataUrl) {
        this.selectedPhoto = photo.dataUrl;
        this.photoUrl = photo.dataUrl;
      }
    } catch {
      this.errorMessage = 'La caméra est indisponible ou son accès a été refusé.';
    }
  }

  async save(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.isSaving = true;
    try {
      const profile = await this.userService.getCurrentProfile();
      const profileUpdate = this.form.getRawValue();
      let savedPhotoUrl = this.photoUrl;

      if (this.selectedPhoto) {
        if (!profile) {
          throw new Error('PROFILE_NOT_CONFIGURED');
        }

        savedPhotoUrl = await this.storageService.uploadProfilePhoto(profile.id, this.selectedPhoto);
      }

      await this.userService.updateCurrentProfile({
        ...profileUpdate,
        ...(savedPhotoUrl ? { photoUrl: savedPhotoUrl } : {}),
      });
      this.photoUrl = savedPhotoUrl;

      this.selectedPhoto = '';
      this.successMessage = 'Profil mis à jour.';
    } catch (error) {
      this.errorMessage = this.getErrorMessage(error);
    } finally {
      this.isSaving = false;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message === 'STORAGE_NOT_CONFIGURED') {
      return 'Firebase Storage n’est pas configuré.';
    }

    if (error instanceof Error && error.message === 'PROFILE_NOT_CONFIGURED') {
      return 'Votre session Firebase est indisponible.';
    }

    return 'Impossible d’enregistrer le profil. Vérifiez Firebase et réessayez.';
  }
}