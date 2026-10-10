import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Movie, UserProfile } from '../models';
import { AdminService, AdminStats } from '../core/services/admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  imports: [
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonText,
    IonTextarea,
    IonTitle,
    IonToolbar,
    ReactiveFormsModule,
  ],
})
export class AdminPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly formBuilder = inject(FormBuilder);

  readonly movieForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    overview: ['', [Validators.required, Validators.maxLength(1200)]],
    posterPath: ['', [Validators.required]],
    backdropPath: [''],
    releaseDate: ['', [Validators.required]],
    voteAverage: [0, [Validators.required, Validators.min(0), Validators.max(10)]],
    genres: [''],
  });

  stats: AdminStats | null = null;
  users: UserProfile[] = [];
  movies: Movie[] = [];
  isLoading = true;
  isSavingMovie = false;
  busyUserId = '';
  busyMovieId = '';
  errorMessage = '';
  successMessage = '';

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const dashboard = await this.adminService.getDashboard();
      this.stats = dashboard.stats;
      this.users = dashboard.users;
      this.movies = dashboard.movies;
    } catch {
      this.errorMessage = 'Impossible de charger le tableau de bord admin.';
    } finally {
      this.isLoading = false;
    }
  }

  async toggleUser(user: UserProfile): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.busyUserId = user.id;

    try {
      await this.adminService.setUserDisabled(user.id, !user.isDisabled);
      await this.loadDashboard();
      this.successMessage = user.isDisabled ? 'Utilisateur reactive.' : 'Utilisateur desactive.';
    } catch {
      this.errorMessage = 'Impossible de modifier cet utilisateur.';
    } finally {
      this.busyUserId = '';
    }
  }

  async addMovie(): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.movieForm.markAllAsTouched();

    if (this.movieForm.invalid) {
      return;
    }

    this.isSavingMovie = true;
    try {
      const formValue = this.movieForm.getRawValue();
      await this.adminService.addMovie({
        ...formValue,
        genres: this.parseGenres(formValue.genres),
      });
      this.movieForm.reset({
        title: '',
        overview: '',
        posterPath: '',
        backdropPath: '',
        releaseDate: '',
        voteAverage: 0,
        genres: '',
      });
      await this.loadDashboard();
      this.successMessage = 'Film ajoute au catalogue.';
    } catch {
      this.errorMessage = 'Impossible d\'ajouter ce film.';
    } finally {
      this.isSavingMovie = false;
    }
  }

  async deleteMovie(movie: Movie): Promise<void> {
    this.errorMessage = '';
    this.successMessage = '';
    this.busyMovieId = movie.id;

    try {
      await this.adminService.deleteMovie(movie.id);
      await this.loadDashboard();
      this.successMessage = 'Film supprime du catalogue.';
    } catch {
      this.errorMessage = 'Impossible de supprimer ce film.';
    } finally {
      this.busyMovieId = '';
    }
  }

  private parseGenres(value: string): string[] {
    return value
      .split(',')
      .map((genre) => genre.trim())
      .filter(Boolean);
  }
}
