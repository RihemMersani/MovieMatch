import { Timestamp } from 'firebase/firestore';

export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  photoUrl: string;
  role: UserRole;
  isDisabled: boolean;
  favoriteMovieIds: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}