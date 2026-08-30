import { CASE_TYPES, DIFFICULTIES, type CaseDefinition } from '@/types/game';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function duplicateIds(ids: string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function getDecisionIds(caseFile: CaseDefinition): string[] {
  switch (caseFile.answer.kind) {
    case 'suspect':
      return caseFile.suspects.map((suspect) => suspect.id);
    case 'statement':
      return caseFile.statements.map((statement) => statement.id);
    case 'evidence':
      return caseFile.evidence.map((item) => item.id);
    case 'timeline':
      return caseFile.timeline.map((event) => event.id);
  }
}

export function validateCase(caseFile: CaseDefinition): ValidationResult {
  const errors: string[] = [];
  const requiredStrings: [string, string][] = [
    ['id', caseFile.id],
    ['title', caseFile.title],
    ['location', caseFile.location],
    ['introduction', caseFile.introduction],
    ['objective', caseFile.objective],
    ['decisionPrompt', caseFile.decisionPrompt],
    ['answer.label', caseFile.answer.label],
    ['explanation', caseFile.explanation],
    ['contradiction', caseFile.contradiction],
  ];

  requiredStrings.forEach(([field, value]) => {
    if (!value?.trim()) errors.push(`${field} is required.`);
  });

  if (!DIFFICULTIES.includes(caseFile.difficulty)) {
    errors.push('difficulty is invalid.');
  }
  if (!CASE_TYPES.includes(caseFile.type)) {
    errors.push('case type is invalid.');
  }
  if (caseFile.suspects.length < 3 || caseFile.suspects.length > 5) {
    errors.push('a case must contain between 3 and 5 suspects.');
  }
  if (caseFile.statements.length < caseFile.suspects.length) {
    errors.push('every suspect must have at least one statement.');
  }
  if (caseFile.evidence.length === 0) errors.push('at least one evidence item is required.');
  if (caseFile.hints.length < 3) errors.push('at least three escalating hints are required.');
  if (caseFile.tags.length === 0) errors.push('at least one tag is required.');
  if (caseFile.estimatedSeconds <= 0) errors.push('estimatedSeconds must be positive.');

  const allIds = [
    ...caseFile.suspects.map((item) => item.id),
    ...caseFile.statements.map((item) => item.id),
    ...caseFile.evidence.map((item) => item.id),
    ...caseFile.timeline.map((item) => item.id),
    ...caseFile.hints.map((item) => item.id),
  ];
  const duplicates = [...new Set(duplicateIds(allIds))];
  if (duplicates.length) errors.push(`duplicate IDs: ${duplicates.join(', ')}.`);

  const suspectIds = new Set(caseFile.suspects.map((suspect) => suspect.id));
  caseFile.statements.forEach((statement) => {
    if (!suspectIds.has(statement.suspectId)) {
      errors.push(`statement ${statement.id} references missing suspect ${statement.suspectId}.`);
    }
  });

  const referenceIds = new Set(allIds);
  caseFile.hints.forEach((hint) => {
    if (hint.focusId && !referenceIds.has(hint.focusId)) {
      errors.push(`hint ${hint.id} references missing item ${hint.focusId}.`);
    }
  });

  caseFile.timeline.forEach((event) => {
    if (parseTime(event.time) === null) {
      errors.push(`timeline event ${event.id} has invalid time ${event.time}.`);
    }
  });

  const decisionIds = getDecisionIds(caseFile);
  if (!decisionIds.includes(caseFile.answer.targetId)) {
    errors.push(`answer target ${caseFile.answer.targetId} does not exist.`);
  }
  if (!caseFile.explanation.toLocaleLowerCase().includes(caseFile.answer.label.toLocaleLowerCase())) {
    errors.push('explanation must name the correct answer.');
  }
  if (
    caseFile.solutionCandidateIds.length !== 1 ||
    caseFile.solutionCandidateIds[0] !== caseFile.answer.targetId
  ) {
    errors.push('case must expose exactly one solution candidate matching the answer.');
  }

  if (caseFile.source === 'generated') {
    const audit = caseFile.generationAudit;
    if (!audit) {
      errors.push('generated case is missing its logic audit.');
    } else {
      const auditedIds = Object.keys(audit.candidateSolutions).sort();
      const expectedIds = [...decisionIds].sort();
      if (auditedIds.join('|') !== expectedIds.join('|')) {
        errors.push('generated case audit must cover every decision target.');
      }
      const validSolutions = auditedIds.filter((id) => audit.candidateSolutions[id]);
      if (validSolutions.length !== 1 || validSolutions[0] !== caseFile.answer.targetId) {
        errors.push('generated case audit does not prove one unique answer.');
      }
      if (!audit.evidenceConsistent) errors.push('generated evidence is internally inconsistent.');
      if (!audit.distractorsPossible) errors.push('generated distractors are not logically possible.');
      if (!audit.derivableFromShownInformation) errors.push('generated answer is not derivable from shown information.');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidCase(caseFile: CaseDefinition): CaseDefinition {
  const result = validateCase(caseFile);
  if (!result.valid) {
    throw new Error(`Invalid case "${caseFile.id}": ${result.errors.join(' ')}`);
  }
  return caseFile;
}

export function parseCase(value: unknown): CaseDefinition {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Case payload must be an object.');
  }
  return assertValidCase(value as CaseDefinition);
}
