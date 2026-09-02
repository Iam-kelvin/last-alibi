import type { PlayerState } from '@/types/game';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: (state: PlayerState) => boolean;
}

const solvedByType = (state: PlayerState, type: string) =>
  Object.values(state.completedCases).filter((record) => record.caseType === type).length;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-case', title: 'First Case Closed', description: 'Solve your first case.', icon: '✓', isUnlocked: (s) => s.stats.casesSolved >= 1 },
  { id: 'perfect-deduction', title: 'Perfect Deduction', description: 'Solve on the first try without a hint.', icon: '◆', isUnlocked: (s) => s.stats.perfectSolves >= 1 || Object.values(s.completedCases).some((r) => r.firstTry && r.hintsUsed === 0) },
  { id: 'ten-closed', title: '10 Cases Closed', description: 'Solve ten cases.', icon: '10', isUnlocked: (s) => s.stats.casesSolved >= 10 },
  { id: 'hundred-closed', title: '100 Cases Closed', description: 'Solve one hundred cases.', icon: '100', isUnlocked: (s) => s.stats.casesSolved >= 100 },
  { id: 'no-hint', title: 'No Hint Needed', description: 'Close five cases without hints.', icon: '✦', isUnlocked: (s) => s.stats.noHintSolves >= 5 || Object.values(s.completedCases).filter((r) => r.hintsUsed === 0).length >= 5 },
  { id: 'seven-streak', title: 'Seven-Day Streak', description: 'Close the Daily Case seven days running.', icon: '7', isUnlocked: (s) => s.longestDailyStreak >= 7 },
  { id: 'thirty-streak', title: 'Thirty-Day Streak', description: 'Close the Daily Case thirty days running.', icon: '30', isUnlocked: (s) => s.longestDailyStreak >= 30 },
  { id: 'alibi-breaker', title: 'Alibi Breaker', description: 'Solve five Broken Alibi cases.', icon: '⌁', isUnlocked: (s) => solvedByType(s, 'Broken Alibi') >= 5 },
  { id: 'timeline-expert', title: 'Timeline Expert', description: 'Solve five Timeline cases.', icon: '◷', isUnlocked: (s) => solvedByType(s, 'Timeline') >= 5 },
  { id: 'evidence-master', title: 'Evidence Master', description: 'Solve five Impossible Evidence cases.', icon: '⌕', isUnlocked: (s) => solvedByType(s, 'Impossible Evidence') >= 5 },
  { id: 'speed-detective', title: 'Speed Detective', description: 'Score at least 5,000 in Rapid Deduction.', icon: '⚡', isUnlocked: (s) => s.bestRapidScore >= 5000 },
  { id: 'master-case', title: 'Master Case Solved', description: 'Close a Master difficulty case.', icon: '♛', isUnlocked: (s) => Object.values(s.completedCases).some((r) => r.difficulty === 'Master') },
];

export function unlockEligibleAchievements(state: PlayerState, now = new Date().toISOString()): PlayerState {
  const unlockedAchievements = { ...state.unlockedAchievements };
  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedAchievements[achievement.id] && achievement.isUnlocked(state)) {
      unlockedAchievements[achievement.id] = now;
    }
  }
  return { ...state, unlockedAchievements };
}
