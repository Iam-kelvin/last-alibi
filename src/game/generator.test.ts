import { describe, expect, it } from 'vitest';

import { getDailyCase, getDailySeed } from '@/game/daily';
import { validateCase } from '@/game/case-validation';
import { generateCase } from '@/game/generator';

describe('seeded generation', () => {
  it('is deterministic for the same seed and version', () => {
    expect(generateCase('repeatable-seed')).toEqual(generateCase('repeatable-seed'));
  });

  it('produces unique, structurally valid, uniquely solvable cases', () => {
    const generated = Array.from({ length: 200 }, (_, index) => generateCase(`validation-${index}`));
    expect(new Set(generated.map((caseFile) => caseFile.id)).size).toBe(generated.length);
    for (const caseFile of generated) {
      expect(validateCase(caseFile), caseFile.id).toEqual({ valid: true, errors: [] });
      expect(caseFile.solutionCandidateIds).toEqual([caseFile.answer.targetId]);
      const auditedSolutions = Object.entries(caseFile.generationAudit!.candidateSolutions)
        .filter(([, valid]) => valid)
        .map(([id]) => id);
      expect(auditedSolutions).toEqual([caseFile.answer.targetId]);
    }
  });

  it('selects the same daily case for the same calendar day', () => {
    expect(getDailySeed('2026-08-26')).toBe(getDailySeed('2026-08-26'));
    expect(getDailyCase('2026-08-26')).toEqual(getDailyCase('2026-08-26'));
    expect(getDailyCase('2026-08-26').id).not.toBe(getDailyCase('2026-08-27').id);
  });
});
