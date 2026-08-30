import { describe, expect, it } from 'vitest';

import { calculateDailyStreak, getPlayerLevel } from '@/game/progression';
import type { DailyResult } from '@/types/game';

function result(dateKey: string): DailyResult {
  return {
    dateKey, official: true, caseId: dateKey, caseType: 'Liar', difficulty: 'Beginner', mode: 'daily',
    completedAt: `${dateKey}T12:00:00.000Z`, score: 1000, elapsedSeconds: 60, wrongGuesses: 0,
    hintsUsed: 0, firstTry: true, xpEarned: 200,
  };
}

describe('progression', () => {
  it('uses 1-indexed levels', () => {
    expect(getPlayerLevel(0)).toBe(1);
    expect(getPlayerLevel(1499)).toBe(1);
    expect(getPlayerLevel(1500)).toBe(2);
  });

  it('counts only consecutive daily results from the latest result', () => {
    const results = {
      '2026-08-26': result('2026-08-26'),
      '2026-08-25': result('2026-08-25'),
      '2026-08-24': result('2026-08-24'),
      '2026-08-20': result('2026-08-20'),
    };
    expect(calculateDailyStreak(results, '2026-08-26')).toBe(3);
    expect(calculateDailyStreak(results, '2026-08-30')).toBe(0);
  });
});
