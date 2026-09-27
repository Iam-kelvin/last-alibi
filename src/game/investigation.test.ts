import { describe, expect, it } from 'vitest';

import { CURATED_CASES } from '@/data/curated-cases';
import { getNextHint, isCorrectAnswer, isKeyComparison } from '@/game/investigation';

describe('investigation decisions and hints', () => {
  const caseFile = CURATED_CASES[0]!;

  it('accepts only the configured answer target', () => {
    expect(isCorrectAnswer(caseFile, caseFile.answer.targetId)).toBe(true);
    expect(isCorrectAnswer(caseFile, caseFile.suspects[1]!.id)).toBe(false);
    expect(isCorrectAnswer(caseFile, null)).toBe(false);
  });

  it('reveals hints in order and stops after the final hint', () => {
    expect(getNextHint(caseFile, 0)).toEqual(caseFile.hints[0]);
    expect(getNextHint(caseFile, 1)).toEqual(caseFile.hints[1]);
    expect(getNextHint(caseFile, 2)).toEqual(caseFile.hints[2]);
    expect(getNextHint(caseFile, 3)).toBeNull();
  });

  it('recognizes the key comparison in either selection order', () => {
    const [first, second] = caseFile.keyComparison.itemIds;
    expect(isKeyComparison(caseFile, [first, second])).toBe(true);
    expect(isKeyComparison(caseFile, [second, first])).toBe(true);
    expect(isKeyComparison(caseFile, [first])).toBe(false);
    expect(isKeyComparison(caseFile, [first, caseFile.evidence.at(-1)!.id])).toBe(false);
  });
});
