import { UserProfile } from './user.model';

export interface MatchResult {
  user: UserProfile;
  matchScore: number;
  commonMovieIds: string[];
}