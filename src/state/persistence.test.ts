import { describe, expect, it } from 'vitest';

import { deserializePlayerState } from '@/state/persistence';

describe('persistence migration', () => {
  it('falls back safely for corrupt data', () => {
    const state = deserializePlayerState('{broken');
    expect(state.hydrated).toBe(true);
    expect(state.xp).toBe(0);
  });

  it('merges partial saved state with current defaults', () => {
    const state = deserializePlayerState(JSON.stringify({ xp: 3200, tutorialCompleted: true, settings: { sound: false } }));
    expect(state.xp).toBe(3200);
    expect(state.tutorialCompleted).toBe(true);
    expect(state.settings.sound).toBe(false);
    expect(state.settings.haptics).toBe(true);
    expect(state.stats.byType.Timeline).toBe(0);
  });

  it('keeps valid nested completion and daily records', () => {
    const completion = {
      caseId: 'case-one', caseType: 'Liar', difficulty: 'Easy', mode: 'case-files',
      completedAt: '2026-08-26T12:00:00.000Z', score: 1250, elapsedSeconds: 72,
      wrongGuesses: 1, hintsUsed: 0, firstTry: false, xpEarned: 220,
    };
    const daily = {
      ...completion, caseId: 'daily-one', mode: 'daily', dateKey: '2026-08-26', official: true,
    };
    const state = deserializePlayerState(JSON.stringify({
      completedCases: { 'case-one': completion },
      dailyResults: { '2026-08-26': daily },
      unlockedAchievements: { 'first-case': '2026-08-26T12:00:00.000Z' },
    }));

    expect(state.completedCases['case-one']).toEqual(completion);
    expect(state.dailyResults['2026-08-26']).toEqual(daily);
    expect(state.unlockedAchievements['first-case']).toBe('2026-08-26T12:00:00.000Z');
  });

  it('drops malformed nested records while preserving valid siblings', () => {
    const valid = {
      caseId: 'valid', caseType: 'Timeline', difficulty: 'Normal', mode: 'endless',
      completedAt: '2026-08-26T12:00:00.000Z', score: 900, elapsedSeconds: 100,
      wrongGuesses: 0, hintsUsed: 1, firstTry: true, xpEarned: 180,
    };
    const state = deserializePlayerState(JSON.stringify({
      completedCases: {
        valid,
        nullish: null,
        mismatch: { ...valid, caseId: 'somewhere-else' },
        negative: { ...valid, caseId: 'negative', score: -1 },
        badType: { ...valid, caseId: 'badType', caseType: 'Unknown' },
      },
      dailyResults: {
        '2026-02-30': { ...valid, mode: 'daily', dateKey: '2026-02-30', official: true },
        '2026-08-27': { ...valid, mode: 'daily', dateKey: 'wrong-date', official: true },
        '2026-08-28': { ...valid, mode: 'daily', dateKey: '2026-08-28', official: false },
      },
      unlockedAchievements: { good: '2026-08-26T12:00:00.000Z', bad: null },
    }));

    expect(Object.keys(state.completedCases)).toEqual(['valid']);
    expect(state.dailyResults).toEqual({});
    expect(state.unlockedAchievements).toEqual({ good: '2026-08-26T12:00:00.000Z' });
  });

  it('sanitizes counters, chapter IDs, settings, and per-type stats', () => {
    const state = deserializePlayerState(JSON.stringify({
      xp: Number.NaN,
      endlessCounter: 1.5,
      unlockedChapterIds: ['missing-objects', 'missing-objects', null, ''],
      stats: { casesSolved: -2, totalSolveSeconds: 42, byType: { Timeline: 3, Liar: 'many' } },
      settings: { sound: 'yes', music: false, theme: 'invalid', textSize: 'extra-large' },
    }));

    expect(state.xp).toBe(0);
    expect(state.endlessCounter).toBe(0);
    expect(state.unlockedChapterIds).toEqual(['small-crimes', 'missing-objects']);
    expect(state.stats.casesSolved).toBe(0);
    expect(state.stats.totalSolveSeconds).toBe(42);
    expect(state.stats.byType.Timeline).toBe(3);
    expect(state.stats.byType.Liar).toBe(0);
    expect(state.settings.sound).toBe(true);
    expect(state.settings.music).toBe(false);
    expect(state.settings.theme).toBe('noir');
    expect(state.settings.textSize).toBe('extra-large');
  });
});
