import { describe, expect, it } from 'vitest';

import { calculateScore, calculateXp } from '@/game/scoring';

describe('scoring', () => {
  it('awards first-try, no-hint, fast, and difficulty bonuses', () => {
    const score = calculateScore({ difficulty: 'Hard', elapsedSeconds: 60, targetSeconds: 180, wrongGuesses: 0, hintsUsed: 0 });
    expect(score.total).toBe(1550);
    expect(score.firstTryBonus).toBe(100);
    expect(score.noHintBonus).toBe(100);
  });

  it('penalizes guesses, hints, and excess time', () => {
    const clean = calculateScore({ difficulty: 'Normal', elapsedSeconds: 100, targetSeconds: 180, wrongGuesses: 0, hintsUsed: 0 });
    const penalized = calculateScore({ difficulty: 'Normal', elapsedSeconds: 400, targetSeconds: 180, wrongGuesses: 2, hintsUsed: 2 });
    expect(penalized.total).toBeLessThan(clean.total);
  });

  it('never returns a score below zero', () => {
    const score = calculateScore({ difficulty: 'Beginner', elapsedSeconds: 9999, targetSeconds: 60, wrongGuesses: 99, hintsUsed: 99 });
    expect(score.total).toBe(0);
    expect(calculateXp(score.total, 'Beginner')).toBeGreaterThanOrEqual(50);
  });
});
