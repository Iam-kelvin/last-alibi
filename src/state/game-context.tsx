import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type PropsWithChildren } from 'react';

import { unlockEligibleAchievements } from '@/game/achievements';
import { CHAPTERS } from '@/data/chapters';
import { CURATED_CASE_MAP } from '@/data/curated-cases';
import { calculateDailyStreak } from '@/game/progression';
import { calculateXp } from '@/game/scoring';
import { reportError, track } from '@/services/analytics';
import { createDefaultPlayerState } from '@/state/default-state';
import { clearPlayerState, loadPlayerState, savePlayerState } from '@/state/persistence';
import type { CaseDefinition, CasePerformance, CompletionRecord, GameMode, PlayerSettings, PlayerState } from '@/types/game';

type Action =
  | { type: 'hydrate'; state: PlayerState }
  | { type: 'tutorial-complete' }
  | { type: 'case-started' }
  | { type: 'case-completed'; caseFile: CaseDefinition; record: CompletionRecord; dateKey?: string }
  | { type: 'rapid-completed'; score: number }
  | { type: 'settings'; patch: Partial<PlayerSettings> }
  | { type: 'endless-next' }
  | { type: 'reset' };

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'tutorial-complete':
      return { ...state, tutorialCompleted: true };
    case 'case-started':
      return { ...state, stats: { ...state.stats, casesStarted: state.stats.casesStarted + 1 } };
    case 'case-completed': {
      const prior = state.completedCases[action.record.caseId];
      const awardXp = !prior;
      const record = awardXp ? action.record : { ...action.record, xpEarned: 0 };
      const completedCases = {
        ...state.completedCases,
        [record.caseId]: prior && prior.score >= record.score ? prior : record,
      };
      const dailyResults = action.dateKey && !state.dailyResults[action.dateKey]
        ? { ...state.dailyResults, [action.dateKey]: { ...record, dateKey: action.dateKey, official: true as const } }
        : state.dailyResults;
      const currentDailyStreak = calculateDailyStreak(dailyResults);
      const curatedSolved = Object.keys(completedCases).filter((caseId) => CURATED_CASE_MAP[caseId]).length;
      const unlockedChapterIds = CHAPTERS.filter((chapter) => curatedSolved >= chapter.requiredSolved).map((chapter) => chapter.id);
      const next: PlayerState = {
        ...state,
        xp: state.xp + (awardXp ? record.xpEarned : 0),
        completedCases,
        unlockedChapterIds,
        dailyResults,
        currentDailyStreak,
        longestDailyStreak: Math.max(state.longestDailyStreak, currentDailyStreak),
        stats: {
          ...state.stats,
          casesSolved: state.stats.casesSolved + 1,
          firstTrySolves: state.stats.firstTrySolves + (record.firstTry ? 1 : 0),
          perfectSolves: state.stats.perfectSolves + (record.firstTry && record.hintsUsed === 0 ? 1 : 0),
          noHintSolves: state.stats.noHintSolves + (record.hintsUsed === 0 ? 1 : 0),
          totalWrongGuesses: state.stats.totalWrongGuesses + record.wrongGuesses,
          totalHintsUsed: state.stats.totalHintsUsed + record.hintsUsed,
          totalSolveSeconds: state.stats.totalSolveSeconds + record.elapsedSeconds,
          byType: {
            ...state.stats.byType,
            [action.caseFile.type]: state.stats.byType[action.caseFile.type] + 1,
          },
        },
      };
      return unlockEligibleAchievements(next);
    }
    case 'rapid-completed':
      return unlockEligibleAchievements({ ...state, bestRapidScore: Math.max(state.bestRapidScore, action.score) });
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'endless-next':
      return { ...state, endlessCounter: state.endlessCounter + 1 };
    case 'reset': {
      const reset = createDefaultPlayerState();
      return { ...reset, hydrated: true, settings: state.settings };
    }
  }
}

interface GameContextValue {
  state: PlayerState;
  completeTutorial(): void;
  startCase(caseFile: CaseDefinition, mode: GameMode): void;
  completeCase(caseFile: CaseDefinition, performance: CasePerformance, mode: GameMode, dateKey?: string): CompletionRecord;
  completeRapid(score: number, solved: number): void;
  updateSettings(patch: Partial<PlayerSettings>): void;
  advanceEndless(): void;
  resetProgress(): Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, undefined, createDefaultPlayerState);
  const knownAchievements = useRef<Set<string> | null>(null);

  useEffect(() => {
    loadPlayerState().then((loaded) => dispatch({ type: 'hydrate', state: loaded })).catch((error) => {
      reportError(error, { operation: 'load_player_state' });
      dispatch({ type: 'hydrate', state: { ...createDefaultPlayerState(), hydrated: true } });
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    savePlayerState(state).catch((error) => reportError(error, { operation: 'save_player_state' }));
  }, [state]);

  useEffect(() => {
    if (!state.hydrated) return;
    const current = new Set(Object.keys(state.unlockedAchievements));
    if (knownAchievements.current) {
      current.forEach((achievementId) => {
        if (!knownAchievements.current!.has(achievementId)) {
          track('achievement_unlocked', { achievement_id: achievementId });
        }
      });
    }
    knownAchievements.current = current;
  }, [state.hydrated, state.unlockedAchievements]);

  const completeTutorial = useCallback(() => {
    dispatch({ type: 'tutorial-complete' });
    track('tutorial_completed');
  }, []);

  const startCase = useCallback((caseFile: CaseDefinition, mode: GameMode) => {
    dispatch({ type: 'case-started' });
    track('case_started', { case_id: caseFile.id, mode, difficulty: caseFile.difficulty, case_type: caseFile.type });
  }, []);

  const completeCase = useCallback((caseFile: CaseDefinition, performance: CasePerformance, mode: GameMode, dateKey?: string) => {
    const awardXp = !state.completedCases[caseFile.id];
    const record: CompletionRecord = {
      ...performance,
      caseId: caseFile.id,
      caseType: caseFile.type,
      difficulty: caseFile.difficulty,
      mode,
      completedAt: new Date().toISOString(),
      xpEarned: awardXp ? calculateXp(performance.score, caseFile.difficulty) : 0,
    };
    dispatch({ type: 'case-completed', caseFile, record, dateKey });
    track('case_completed', { case_id: caseFile.id, mode, score: record.score, hints: record.hintsUsed, first_try: record.firstTry });
    if (mode === 'daily' && dateKey && !state.dailyResults[dateKey]) {
      track('daily_completed', { date: dateKey, score: record.score });
    }
    return record;
  }, [state.completedCases, state.dailyResults]);

  const completeRapid = useCallback((score: number, solved: number) => {
    dispatch({ type: 'rapid-completed', score });
    track('rapid_completed', { score, solved });
  }, []);

  const updateSettings = useCallback((patch: Partial<PlayerSettings>) => dispatch({ type: 'settings', patch }), []);
  const advanceEndless = useCallback(() => dispatch({ type: 'endless-next' }), []);
  const resetProgress = useCallback(async () => {
    await clearPlayerState();
    dispatch({ type: 'reset' });
  }, []);

  const value = useMemo<GameContextValue>(() => ({
    state, completeTutorial, startCase, completeCase, completeRapid, updateSettings, advanceEndless, resetProgress,
  }), [state, completeTutorial, startCase, completeCase, completeRapid, updateSettings, advanceEndless, resetProgress]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used inside GameProvider.');
  return context;
}
