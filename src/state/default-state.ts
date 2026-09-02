import { CASE_TYPES, type PlayerState } from '@/types/game';

export const PLAYER_STATE_SCHEMA_VERSION = 1;

export function createDefaultPlayerState(): PlayerState {
  return {
    schemaVersion: PLAYER_STATE_SCHEMA_VERSION,
    hydrated: false,
    tutorialCompleted: false,
    xp: 0,
    completedCases: {},
    unlockedChapterIds: ['small-crimes'],
    dailyResults: {},
    currentDailyStreak: 0,
    longestDailyStreak: 0,
    bestRapidScore: 0,
    stats: {
      casesStarted: 0,
      casesSolved: 0,
      firstTrySolves: 0,
      perfectSolves: 0,
      noHintSolves: 0,
      totalWrongGuesses: 0,
      totalHintsUsed: 0,
      totalSolveSeconds: 0,
      byType: Object.fromEntries(CASE_TYPES.map((type) => [type, 0])) as PlayerState['stats']['byType'],
    },
    unlockedAchievements: {},
    settings: {
      sound: true,
      music: true,
      haptics: true,
      theme: 'noir',
      reducedMotion: false,
      textSize: 'standard',
    },
    endlessCounter: 0,
  };
}
