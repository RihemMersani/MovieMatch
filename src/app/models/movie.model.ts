export type MovieSource = 'TMDB' | 'MANUAL';

export interface Movie {
  id: string;
  title: string;
  overview: string;
  posterPath: string;
  backdropPath?: string;
  releaseDate: string;
  voteAverage: number;
  genres: string[];
  source: MovieSource;
  tmdbId?: number;
}