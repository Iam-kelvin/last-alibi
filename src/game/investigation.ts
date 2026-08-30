import type { CaseDefinition, CaseHint } from '@/types/game';

export function isCorrectAnswer(caseFile: CaseDefinition, targetId: string | null): boolean {
  return Boolean(targetId) && caseFile.answer.targetId === targetId;
}

export function getNextHint(caseFile: CaseDefinition, hintsUsed: number): CaseHint | null {
  const safeIndex = Math.max(0, Math.floor(hintsUsed));
  return caseFile.hints[safeIndex] ?? null;
}
