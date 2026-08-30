import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDefaultPlayerState, PLAYER_STATE_SCHEMA_VERSION } from '@/state/default-state';
import { calculateDailyStreak } from '@/game/progression';
import { CASE_TYPES, type PlayerState } from '@/types/game';

export const PLAYER_STATE_STORAGE_KEY = '@last-alibi/player-state/v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function deserializePlayerState(raw: string | null): PlayerState {
  const defaults = createDefaultPlayerState();
  if (!raw) return { ...defaults, hydrated: true };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { ...defaults, hydrated: true };
    const settings = isRecord(parsed.settings) ? parsed.settings : {};
    const stats = isRecord(parsed.stats) ? parsed.stats : {};
    const parsedByType = isRecord(stats.byType) ? stats.byType : {};
    const byType = Object.fromEntries(
      CASE_TYPES.map((type) => [type, nonNegativeNumber(parsedByType[type], 0)]),
    ) as PlayerState['stats']['byType'];

    const dailyResults = isRecord(parsed.dailyResults) ? parsed.dailyResults as PlayerState['dailyResults'] : {};
    const unlockedChapterIds = Array.isArray(parsed.unlockedChapterIds)
      ? parsed.unlockedChapterIds.filter((value): value is string => typeof value === 'string')
      : defaults.unlockedChapterIds;

    return {
      ...defaults,
      schemaVersion: PLAYER_STATE_SCHEMA_VERSION,
      hydrated: true,
      tutorialCompleted: typeof parsed.tutorialCompleted === 'boolean' ? parsed.tutorialCompleted : false,
      xp: nonNegativeNumber(parsed.xp, 0),
      completedCases: isRecord(parsed.completedCases) ? parsed.completedCases as PlayerState['completedCases'] : {},
      unlockedChapterIds: unlockedChapterIds.includes('small-crimes') ? unlockedChapterIds : ['small-crimes', ...unlockedChapterIds],
      dailyResults,
      currentDailyStreak: calculateDailyStreak(dailyResults),
      longestDailyStreak: nonNegativeNumber(parsed.longestDailyStreak, 0),
      bestRapidScore: nonNegativeNumber(parsed.bestRapidScore, 0),
      unlockedAchievements: isRecord(parsed.unlockedAchievements) ? parsed.unlockedAchievements as Record<string, string> : {},
      endlessCounter: nonNegativeNumber(parsed.endlessCounter, 0),
      stats: {
        casesStarted: nonNegativeNumber(stats.casesStarted, 0),
        casesSolved: nonNegativeNumber(stats.casesSolved, 0),
        firstTrySolves: nonNegativeNumber(stats.firstTrySolves, 0),
        totalWrongGuesses: nonNegativeNumber(stats.totalWrongGuesses, 0),
        totalHintsUsed: nonNegativeNumber(stats.totalHintsUsed, 0),
        totalSolveSeconds: nonNegativeNumber(stats.totalSolveSeconds, 0),
        byType,
      },
      settings: {
        sound: typeof settings.sound === 'boolean' ? settings.sound : defaults.settings.sound,
        music: typeof settings.music === 'boolean' ? settings.music : defaults.settings.music,
        haptics: typeof settings.haptics === 'boolean' ? settings.haptics : defaults.settings.haptics,
        reducedMotion: typeof settings.reducedMotion === 'boolean' ? settings.reducedMotion : defaults.settings.reducedMotion,
        theme: settings.theme === 'midnight' || settings.theme === 'system' ? settings.theme : 'noir',
        textSize: settings.textSize === 'large' || settings.textSize === 'extra-large' ? settings.textSize : 'standard',
      },
    };
  } catch {
    return { ...defaults, hydrated: true };
  }
}

export async function loadPlayerState(): Promise<PlayerState> {
  return deserializePlayerState(await AsyncStorage.getItem(PLAYER_STATE_STORAGE_KEY));
}

export async function savePlayerState(state: PlayerState): Promise<void> {
  const { hydrated: _hydrated, ...persistedState } = state;
  await AsyncStorage.setItem(PLAYER_STATE_STORAGE_KEY, JSON.stringify(persistedState));
}

export async function clearPlayerState(): Promise<void> {
  await AsyncStorage.removeItem(PLAYER_STATE_STORAGE_KEY);
}
