import AsyncStorage from '@react-native-async-storage/async-storage';

import { CHAPTERS } from '@/data/chapters';
import { calculateDailyStreak } from '@/game/progression';
import { createDefaultPlayerState, PLAYER_STATE_SCHEMA_VERSION } from '@/state/default-state';
import {
  CASE_TYPES,
  DIFFICULTIES,
  type CompletionRecord,
  type DailyResult,
  type PlayerState,
} from '@/types/game';

export const PLAYER_STATE_STORAGE_KEY = '@last-alibi/player-state/v1';

const GAME_MODES = ['case-files', 'daily', 'endless', 'rapid'] as const;
const CHAPTER_IDS = new Set(CHAPTERS.map((chapter) => chapter.id));
let persistenceQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback;
}

function validTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function validDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}

function sanitizeCompletion(value: unknown, expectedCaseId?: string): CompletionRecord | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.caseId) || (expectedCaseId !== undefined && value.caseId !== expectedCaseId)) return null;
  if (!CASE_TYPES.includes(value.caseType as CompletionRecord['caseType'])) return null;
  if (!DIFFICULTIES.includes(value.difficulty as CompletionRecord['difficulty'])) return null;
  if (!GAME_MODES.includes(value.mode as CompletionRecord['mode'])) return null;
  if (!validTimestamp(value.completedAt) || typeof value.firstTry !== 'boolean') return null;

  const numericFields = ['score', 'elapsedSeconds', 'wrongGuesses', 'hintsUsed', 'xpEarned'] as const;
  if (numericFields.some((field) => typeof value[field] !== 'number' || !Number.isSafeInteger(value[field]) || value[field] < 0)) return null;

  return {
    caseId: value.caseId,
    caseType: value.caseType as CompletionRecord['caseType'],
    difficulty: value.difficulty as CompletionRecord['difficulty'],
    mode: value.mode as CompletionRecord['mode'],
    completedAt: value.completedAt,
    score: value.score as number,
    elapsedSeconds: value.elapsedSeconds as number,
    wrongGuesses: value.wrongGuesses as number,
    hintsUsed: value.hintsUsed as number,
    firstTry: value.firstTry,
    xpEarned: value.xpEarned as number,
  };
}

function sanitizeCompletedCases(value: unknown): PlayerState['completedCases'] {
  if (!isRecord(value)) return {};
  const result: PlayerState['completedCases'] = {};
  Object.entries(value).forEach(([caseId, candidate]) => {
    if (!isNonEmptyString(caseId)) return;
    const record = sanitizeCompletion(candidate, caseId);
    if (record) result[caseId] = record;
  });
  return result;
}

function sanitizeDailyResults(value: unknown): PlayerState['dailyResults'] {
  if (!isRecord(value)) return {};
  const result: PlayerState['dailyResults'] = {};
  Object.entries(value).forEach(([dateKey, candidate]) => {
    if (!validDateKey(dateKey) || !isRecord(candidate)) return;
    const completion = sanitizeCompletion(candidate);
    if (!completion || candidate.dateKey !== dateKey || candidate.official !== true || completion.mode !== 'daily') return;
    result[dateKey] = { ...completion, dateKey, official: true } satisfies DailyResult;
  });
  return result;
}

function sanitizeStringList(value: unknown, requiredValue?: string): string[] {
  const entries = Array.isArray(value) ? value.filter(isNonEmptyString) : [];
  const unique = [...new Set(entries)];
  if (requiredValue && !unique.includes(requiredValue)) unique.unshift(requiredValue);
  return unique;
}

function sanitizeAchievements(value: unknown): PlayerState['unlockedAchievements'] {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([id, unlockedAt]) => isNonEmptyString(id) && validTimestamp(unlockedAt)),
  ) as PlayerState['unlockedAchievements'];
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
      CASE_TYPES.map((type) => [type, nonNegativeInteger(parsedByType[type], 0)]),
    ) as PlayerState['stats']['byType'];
    const completedCases = sanitizeCompletedCases(parsed.completedCases);
    const completedRecords = Object.values(completedCases);
    const dailyResults = sanitizeDailyResults(parsed.dailyResults);
    const currentDailyStreak = calculateDailyStreak(dailyResults);

    return {
      ...defaults,
      schemaVersion: PLAYER_STATE_SCHEMA_VERSION,
      hydrated: true,
      tutorialCompleted: typeof parsed.tutorialCompleted === 'boolean' ? parsed.tutorialCompleted : false,
      xp: nonNegativeInteger(parsed.xp, 0),
      completedCases,
      unlockedChapterIds: sanitizeStringList(parsed.unlockedChapterIds, 'small-crimes').filter((id) => CHAPTER_IDS.has(id)),
      dailyResults,
      currentDailyStreak,
      longestDailyStreak: Math.max(currentDailyStreak, nonNegativeInteger(parsed.longestDailyStreak, 0)),
      bestRapidScore: nonNegativeInteger(parsed.bestRapidScore, 0),
      unlockedAchievements: sanitizeAchievements(parsed.unlockedAchievements),
      endlessCounter: nonNegativeInteger(parsed.endlessCounter, 0),
      stats: {
        casesStarted: nonNegativeInteger(stats.casesStarted, 0),
        casesSolved: nonNegativeInteger(stats.casesSolved, 0),
        firstTrySolves: nonNegativeInteger(stats.firstTrySolves, 0),
        perfectSolves: nonNegativeInteger(stats.perfectSolves, completedRecords.filter((record) => record.firstTry && record.hintsUsed === 0).length),
        noHintSolves: nonNegativeInteger(stats.noHintSolves, completedRecords.filter((record) => record.hintsUsed === 0).length),
        totalWrongGuesses: nonNegativeInteger(stats.totalWrongGuesses, 0),
        totalHintsUsed: nonNegativeInteger(stats.totalHintsUsed, 0),
        totalSolveSeconds: nonNegativeInteger(stats.totalSolveSeconds, 0),
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

export function savePlayerState(state: PlayerState): Promise<void> {
  const { hydrated: _hydrated, ...persistedState } = state;
  const serialized = JSON.stringify(persistedState);
  const operation = persistenceQueue.catch(() => undefined).then(() => AsyncStorage.setItem(PLAYER_STATE_STORAGE_KEY, serialized));
  persistenceQueue = operation;
  return operation;
}

export function clearPlayerState(): Promise<void> {
  const operation = persistenceQueue.catch(() => undefined).then(() => AsyncStorage.removeItem(PLAYER_STATE_STORAGE_KEY));
  persistenceQueue = operation;
  return operation;
}
