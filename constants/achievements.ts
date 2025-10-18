import type { User, ScoreRecord, Achievement, AchievementCode } from '../types';

export const ACHIEVEMENTS: Record<AchievementCode, Achievement> = {
  NOVICE_TRAINER: {
    code: 'NOVICE_TRAINER',
    name: 'Novice Trainer',
    description: 'Complete your first practice session.',
    icon: '🔰',
  },
  CRYSTAL_CLEAR_90: {
    code: 'CRYSTAL_CLEAR_90',
    name: 'Crystal Clear',
    description: 'Achieve a clarity score of 90% or higher.',
    icon: '🥇',
  },
  STREAK_MASTER_3: {
    code: 'STREAK_MASTER_3',
    name: 'Streak Master',
    description: 'Maintain a practice streak of 3 days.',
    icon: '🔥',
  },
  DEDICATED_PRACTITIONER: {
    code: 'DEDICATED_PRACTITIONER',
    name: 'Dedicated Practitioner',
    description: 'Complete 10 practice sessions.',
    icon: '📚',
  },
};

export const checkAndAwardAchievements = (user: User, allScores: ScoreRecord[]): AchievementCode[] => {
  const newAchievements: AchievementCode[] = [];
  const userScores = allScores.filter(s => s.userId === user.email);

  // 1. Novice Trainer (first session)
  if (userScores.length >= 1 && !user.achievements.includes('NOVICE_TRAINER')) {
    newAchievements.push('NOVICE_TRAINER');
  }

  // 2. Crystal Clear (score > 90)
  if (userScores.some(s => s.score >= 90) && !user.achievements.includes('CRYSTAL_CLEAR_90')) {
    newAchievements.push('CRYSTAL_CLEAR_90');
  }

  // 3. Streak Master (3-day streak)
  if (user.streak >= 3 && !user.achievements.includes('STREAK_MASTER_3')) {
    newAchievements.push('STREAK_MASTER_3');
  }

  // 4. Dedicated Practitioner (10 sessions)
  if (userScores.length >= 10 && !user.achievements.includes('DEDICATED_PRACTITIONER')) {
    newAchievements.push('DEDICATED_PRACTITIONER');
  }

  return newAchievements;
};
