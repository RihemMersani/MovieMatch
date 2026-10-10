import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  isAdmin = false;

  async ngOnInit(): Promise<void> {
    const profile = await this.authService.getCurrentProfile();
    this.isAdmin = profile?.role === 'ADMIN';
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
  }

  async openProfile(): Promise<void> {
    await this.router.navigateByUrl('/profile');
  }

  async openMovies(): Promise<void> {
    await this.router.navigateByUrl('/movies');
  }

  async openFavorites(): Promise<void> {
    await this.router.navigateByUrl('/favorites');
  }

  async openMatches(): Promise<void> {
    await this.router.navigateByUrl('/matches');
  }

  async openAdmin(): Promise<void> {
    if (!this.isAdmin) {
      return;
    }

    await this.router.navigateByUrl('/admin');
  }
}
