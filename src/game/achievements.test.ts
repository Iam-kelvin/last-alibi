import { describe, expect, it } from 'vitest';

import { unlockEligibleAchievements } from '@/game/achievements';
import { createDefaultPlayerState } from '@/state/default-state';

describe('achievement progression', () => {
  it('unlocks the first case and perfect deduction from completed state', () => {
    const state = createDefaultPlayerState();
    state.hydrated = true;
    state.stats.casesSolved = 1;
    state.completedCases.one = {
      caseId: 'one', caseType: 'Liar', difficulty: 'Beginner', mode: 'case-files',
      score: 1200, elapsedSeconds: 45, wrongGuesses: 0, hintsUsed: 0, firstTry: true,
      completedAt: '2026-08-26T00:00:00.000Z', xpEarned: 200,
    };
    const unlocked = unlockEligibleAchievements(state, '2026-08-26T00:00:00.000Z');
    expect(unlocked.unlockedAchievements['first-case']).toBeTruthy();
    expect(unlocked.unlockedAchievements['perfect-deduction']).toBeTruthy();
  });

  it('does not relock or replace an existing unlock date', () => {
    const state = createDefaultPlayerState();
    state.unlockedAchievements['first-case'] = '2026-01-01T00:00:00.000Z';
    const checked = unlockEligibleAchievements(state, '2026-08-26T00:00:00.000Z');
    expect(checked.unlockedAchievements['first-case']).toBe('2026-01-01T00:00:00.000Z');
  });
});
