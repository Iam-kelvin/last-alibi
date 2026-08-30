import type { DailyResult } from '@/types/game';

export const XP_PER_LEVEL = 1500;

export function getPlayerLevel(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
}

export function getLevelProgress(xp: number): { current: number; required: number; ratio: number } {
  const safeXp = Math.max(0, xp);
  const current = safeXp % XP_PER_LEVEL;
  return { current, required: XP_PER_LEVEL, ratio: current / XP_PER_LEVEL };
}

function dateToDayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86_400_000);
}

export function calculateDailyStreak(results: Record<string, DailyResult>, referenceDateKey = getLocalDateKey()): number {
  const dates = Object.keys(results).sort((a, b) => b.localeCompare(a));
  if (dates.length === 0) return 0;
  const daysSinceLatest = dateToDayNumber(referenceDateKey) - dateToDayNumber(dates[0]!);
  if (daysSinceLatest < 0 || daysSinceLatest > 1) return 0;
  let streak = 1;
  for (let index = 1; index < dates.length; index += 1) {
    if (dateToDayNumber(dates[index - 1]!) - dateToDayNumber(dates[index]!) === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
