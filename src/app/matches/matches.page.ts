import { Component, OnInit, inject } from '@angular/core';
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
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { MatchResult, Movie } from '../models';
import { MatchingService } from '../core/services/matching.service';
import { MovieService } from '../core/services/movie.service';

interface MatchViewModel extends MatchResult {
  commonMovies: Movie[];
}

@Component({
  selector: 'app-matches',
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
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
    IonSpinner,
    IonText,
    IonTitle,
    IonToolbar,
  ],
})
export class MatchesPage implements OnInit {
  private readonly matchingService = inject(MatchingService);
  private readonly movieService = inject(MovieService);

  matches: MatchViewModel[] = [];
  isLoading = true;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.loadMatches();
  }

  async refresh(): Promise<void> {
    await this.loadMatches();
  }

  private async loadMatches(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const results = await this.matchingService.getCompatibleUsers();
      this.matches = await Promise.all(
        results.map(async (match) => ({
          ...match,
          commonMovies: await this.movieService.getMoviesByIds(match.commonMovieIds),
        })),
      );
    } catch {
      this.errorMessage = 'Impossible de charger les utilisateurs compatibles.';
    } finally {
      this.isLoading = false;
    }
  }
}
