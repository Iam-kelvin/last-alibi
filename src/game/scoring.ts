import type { Difficulty, ScoreBreakdown } from '@/types/game';

const DIFFICULTY_BONUS: Record<Difficulty, number> = {
  Beginner: 0,
  Easy: 75,
  Normal: 150,
  Hard: 250,
  Expert: 375,
  Master: 500,
};

export interface ScoreInput {
  difficulty: Difficulty;
  elapsedSeconds: number;
  targetSeconds: number;
  wrongGuesses: number;
  hintsUsed: number;
}

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const wrongGuesses = Math.max(0, Math.floor(input.wrongGuesses));
  const hintsUsed = Math.max(0, Math.floor(input.hintsUsed));
  const elapsedSeconds = Math.max(0, Math.floor(input.elapsedSeconds));
  const targetSeconds = Math.max(1, Math.floor(input.targetSeconds));
  const firstTryBonus = wrongGuesses === 0 ? 100 : 0;
  const noHintBonus = hintsUsed === 0 ? 100 : 0;
  const speedBonus = elapsedSeconds <= Math.floor(targetSeconds * 0.6) ? 100 : 0;
  const wrongGuessPenalty = wrongGuesses * 175;
  const hintPenalty = [100, 150, 225]
    .slice(0, hintsUsed)
    .reduce((sum, penalty) => sum + penalty, Math.max(0, hintsUsed - 3) * 225);
  const timePenalty = Math.min(450, Math.max(0, elapsedSeconds - targetSeconds) * 2);
  const difficultyBonus = DIFFICULTY_BONUS[input.difficulty];
  const total = Math.max(
    0,
    1000 +
      difficultyBonus +
      firstTryBonus +
      noHintBonus +
      speedBonus -
      wrongGuessPenalty -
      hintPenalty -
      timePenalty,
  );

  return {
    base: 1000,
    difficultyBonus,
    firstTryBonus,
    noHintBonus,
    speedBonus,
    wrongGuessPenalty,
    hintPenalty,
    timePenalty,
    total,
  };
}

export function calculateXp(score: number, difficulty: Difficulty): number {
  const multiplier = 1 + DIFFICULTY_BONUS[difficulty] / 1000;
  return Math.max(50, Math.round((100 + score / 8) * multiplier));
}
