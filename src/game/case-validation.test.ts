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

  it('reports malformed object payloads without throwing a property access error', () => {
    expect(() => validateCase({} as never)).not.toThrow();
    const result = validateCase({} as never);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('answer must be an object.');
    expect(result.errors).toContain('suspects must be an array.');
    expect(() => parseCase({})).toThrow('Invalid case "unknown"');
  });

  it('validates nested fields and requires a statement for every suspect', () => {
    const invalid = structuredClone(CURATED_CASES[0]!);
    invalid.suspects[0]!.name = '';
    invalid.statements = invalid.statements.filter((statement) => statement.suspectId !== invalid.suspects[1]!.id);
    invalid.evidence[0]!.description = '';

    const result = validateCase(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('suspects[0].name is required.');
    expect(result.errors).toContain('evidence[0].description is required.');
    expect(result.errors).toContain(`suspect ${invalid.suspects[1]!.id} has no statement.`);
  });

  it('rejects invalid generated audit values instead of treating them as truthy', () => {
    const invalid = structuredClone(CURATED_CASES[0]!);
    invalid.source = 'generated';
    invalid.generationAudit = {
      candidateSolutions: Object.fromEntries(invalid.statements.map((statement) => [statement.id, false])),
      evidenceConsistent: true,
      distractorsPossible: true,
      derivableFromShownInformation: true,
    };
    (invalid.generationAudit.candidateSolutions as Record<string, unknown>)[invalid.answer.targetId] = 'yes';

    const result = validateCase(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('generated case audit candidates must be booleans.');
    expect(result.errors).toContain('generated case audit does not prove one unique answer.');
  });
});
