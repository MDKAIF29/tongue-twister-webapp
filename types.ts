export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type AchievementCode = 
  | 'NOVICE_TRAINER'
  | 'CRYSTAL_CLEAR_90'
  | 'STREAK_MASTER_3'
  | 'DEDICATED_PRACTITIONER';

export interface Achievement {
    code: AchievementCode;
    name: string;
    description: string;
    icon: string; // Emoji
}

export interface User {
  name: string;
  email: string;
  joinDate: number; // timestamp
  passwordHash: string;
  // Gamification fields
  streak: number;
  lastPracticeTimestamp: number;
  xp: number;
  level: number;
  achievements: AchievementCode[];
  favorites: string[]; // array of tongue twister text
}

export interface TongueTwister {
  text: string;
  difficulty: Difficulty;
}

export interface ScoreRecord {
  userId: string; // user email
  score: number;
  text: string;
  timestamp: number;
  difficulty: Difficulty;
}
