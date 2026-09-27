import type { CaseDefinition, CaseHint } from '@/types/game';

export function isCorrectAnswer(caseFile: CaseDefinition, targetId: string | null): boolean {
  return Boolean(targetId) && caseFile.answer.targetId === targetId;
}

export function getNextHint(caseFile: CaseDefinition, hintsUsed: number): CaseHint | null {
  const safeIndex = Math.max(0, Math.floor(hintsUsed));
  return caseFile.hints[safeIndex] ?? null;
}

export function isKeyComparison(caseFile: CaseDefinition, itemIds: string[]): boolean {
  if (itemIds.length !== 2 || itemIds[0] === itemIds[1]) return false;
  const expected = new Set(caseFile.keyComparison.itemIds);
  return expected.size === 2 && itemIds.every((id) => expected.has(id));
}
