import { describe, expect, it } from 'vitest';

import { CURATED_CASES } from '@/data/curated-cases';
import { parseCase, validateCase } from '@/game/case-validation';

describe('curated case parser and validation', () => {
  it('accepts every bundled case', () => {
    for (const caseFile of CURATED_CASES) {
      expect(validateCase(caseFile), caseFile.id).toEqual({ valid: true, errors: [] });
    }
  });

  it('has unique case IDs and all six case structures', () => {
    expect(new Set(CURATED_CASES.map((caseFile) => caseFile.id)).size).toBe(CURATED_CASES.length);
    expect(new Set(CURATED_CASES.map((caseFile) => caseFile.type)).size).toBe(6);
  });

  it('rejects a missing answer and invalid hint reference', () => {
    const invalid = structuredClone(CURATED_CASES[0]!);
    invalid.answer.targetId = 'missing';
    invalid.hints[0]!.focusId = 'also-missing';
    const result = validateCase(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('does not exist');
    expect(result.errors.join(' ')).toContain('references missing item');
  });

  it('parses a serialized structured case and rejects non-object payloads', () => {
    const serialized = JSON.stringify(CURATED_CASES[0]);
    expect(parseCase(JSON.parse(serialized))).toEqual(CURATED_CASES[0]);
    expect(() => parseCase('not-a-case')).toThrow('must be an object');
  });
});
