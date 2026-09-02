import { CASE_TYPES, DIFFICULTIES, type CaseDefinition, type DecisionKind } from '@/types/game';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const DECISION_KINDS = ['suspect', 'statement', 'evidence', 'timeline'] as const;
const EVIDENCE_TYPES = ['record', 'object', 'message', 'weather', 'photo', 'map', 'witness'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
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

function requireString(errors: string[], field: string, value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    errors.push(`${field} is required.`);
    return false;
  }
  return true;
}

function validateArrayShape(errors: string[], field: string, value: unknown): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array.`);
    return false;
  }
  return true;
}

function decisionIdsForKind(
  kind: DecisionKind,
  suspects: Record<string, unknown>[],
  statements: Record<string, unknown>[],
  evidence: Record<string, unknown>[],
  timeline: Record<string, unknown>[],
): string[] {
  const source = kind === 'suspect' ? suspects : kind === 'statement' ? statements : kind === 'evidence' ? evidence : timeline;
  return source.map((item) => item.id).filter((id): id is string => typeof id === 'string');
}

export function getDecisionIds(caseFile: CaseDefinition): string[] {
  const value = caseFile as unknown;
  if (!isRecord(value) || !isRecord(value.answer) || !DECISION_KINDS.includes(value.answer.kind as DecisionKind)) return [];
  return decisionIdsForKind(
    value.answer.kind as DecisionKind,
    recordArray(value.suspects),
    recordArray(value.statements),
    recordArray(value.evidence),
    recordArray(value.timeline),
  );
}

export function validateCase(caseFile: CaseDefinition): ValidationResult {
  const errors: string[] = [];
  const value = caseFile as unknown;
  if (!isRecord(value)) return { valid: false, errors: ['case payload must be an object.'] };

  requireString(errors, 'id', value.id);
  requireString(errors, 'title', value.title);
  requireString(errors, 'location', value.location);
  requireString(errors, 'introduction', value.introduction);
  requireString(errors, 'objective', value.objective);
  requireString(errors, 'decisionPrompt', value.decisionPrompt);
  requireString(errors, 'explanation', value.explanation);
  requireString(errors, 'contradiction', value.contradiction);

  if (!Number.isInteger(value.version) || (value.version as number) <= 0) errors.push('version must be a positive integer.');
  if (value.source !== 'curated' && value.source !== 'generated') errors.push('source is invalid.');
  if (!DIFFICULTIES.includes(value.difficulty as CaseDefinition['difficulty'])) errors.push('difficulty is invalid.');
  if (!CASE_TYPES.includes(value.type as CaseDefinition['type'])) errors.push('case type is invalid.');
  if (value.chapterId !== undefined && !isNonEmptyString(value.chapterId)) errors.push('chapterId must be a non-empty string when provided.');

  validateArrayShape(errors, 'suspects', value.suspects);
  validateArrayShape(errors, 'statements', value.statements);
  validateArrayShape(errors, 'evidence', value.evidence);
  validateArrayShape(errors, 'timeline', value.timeline);
  validateArrayShape(errors, 'hints', value.hints);
  validateArrayShape(errors, 'tags', value.tags);
  validateArrayShape(errors, 'solutionCandidateIds', value.solutionCandidateIds);

  const suspects = recordArray(value.suspects);
  const statements = recordArray(value.statements);
  const evidence = recordArray(value.evidence);
  const timeline = recordArray(value.timeline);
  const hints = recordArray(value.hints);
  const tags = stringArray(value.tags);
  const solutionCandidateIds = stringArray(value.solutionCandidateIds);

  if (Array.isArray(value.suspects) && suspects.length !== value.suspects.length) errors.push('every suspect must be an object.');
  if (Array.isArray(value.statements) && statements.length !== value.statements.length) errors.push('every statement must be an object.');
  if (Array.isArray(value.evidence) && evidence.length !== value.evidence.length) errors.push('every evidence item must be an object.');
  if (Array.isArray(value.timeline) && timeline.length !== value.timeline.length) errors.push('every timeline event must be an object.');
  if (Array.isArray(value.hints) && hints.length !== value.hints.length) errors.push('every hint must be an object.');
  if (Array.isArray(value.tags) && tags.length !== value.tags.length) errors.push('every tag must be a string.');
  if (Array.isArray(value.solutionCandidateIds) && solutionCandidateIds.length !== value.solutionCandidateIds.length) errors.push('every solution candidate ID must be a string.');

  suspects.forEach((suspect, index) => {
    requireString(errors, `suspects[${index}].id`, suspect.id);
    requireString(errors, `suspects[${index}].name`, suspect.name);
    requireString(errors, `suspects[${index}].role`, suspect.role);
    requireString(errors, `suspects[${index}].description`, suspect.description);
    requireString(errors, `suspects[${index}].accent`, suspect.accent);
  });
  statements.forEach((statement, index) => {
    requireString(errors, `statements[${index}].id`, statement.id);
    requireString(errors, `statements[${index}].suspectId`, statement.suspectId);
    requireString(errors, `statements[${index}].title`, statement.title);
    requireString(errors, `statements[${index}].text`, statement.text);
  });
  evidence.forEach((item, index) => {
    requireString(errors, `evidence[${index}].id`, item.id);
    requireString(errors, `evidence[${index}].title`, item.title);
    requireString(errors, `evidence[${index}].description`, item.description);
    if (!EVIDENCE_TYPES.includes(item.type as (typeof EVIDENCE_TYPES)[number])) errors.push(`evidence[${index}].type is invalid.`);
  });
  timeline.forEach((event, index) => {
    requireString(errors, `timeline[${index}].id`, event.id);
    requireString(errors, `timeline[${index}].title`, event.title);
    requireString(errors, `timeline[${index}].description`, event.description);
    if (!isNonEmptyString(event.time) || parseTime(event.time) === null) errors.push(`timeline event ${String(event.id ?? index)} has invalid time ${String(event.time ?? '')}.`);
  });
  hints.forEach((hint, index) => {
    requireString(errors, `hints[${index}].id`, hint.id);
    requireString(errors, `hints[${index}].text`, hint.text);
    if (hint.focusId !== undefined && !isNonEmptyString(hint.focusId)) errors.push(`hints[${index}].focusId must be a non-empty string when provided.`);
  });

  if (suspects.length < 3 || suspects.length > 5) errors.push('a case must contain between 3 and 5 suspects.');
  if (statements.length < suspects.length) errors.push('every suspect must have at least one statement.');
  if (evidence.length === 0) errors.push('at least one evidence item is required.');
  if (hints.length < 3) errors.push('at least three escalating hints are required.');
  if (tags.length === 0) errors.push('at least one tag is required.');
  if (typeof value.estimatedSeconds !== 'number' || !Number.isFinite(value.estimatedSeconds) || value.estimatedSeconds <= 0) errors.push('estimatedSeconds must be positive.');

  const allItems = [...suspects, ...statements, ...evidence, ...timeline, ...hints];
  const allIds = allItems.map((item) => item.id).filter((id): id is string => typeof id === 'string');
  const duplicates = [...new Set(duplicateIds(allIds))];
  if (duplicates.length) errors.push(`duplicate IDs: ${duplicates.join(', ')}.`);

  const suspectIds = new Set(suspects.map((suspect) => suspect.id).filter((id): id is string => typeof id === 'string'));
  statements.forEach((statement) => {
    if (typeof statement.id === 'string' && typeof statement.suspectId === 'string' && !suspectIds.has(statement.suspectId)) {
      errors.push(`statement ${statement.id} references missing suspect ${statement.suspectId}.`);
    }
  });
  suspectIds.forEach((suspectId) => {
    if (!statements.some((statement) => statement.suspectId === suspectId)) errors.push(`suspect ${suspectId} has no statement.`);
  });

  const focusIds = new Set([...suspects, ...statements, ...evidence, ...timeline].map((item) => item.id).filter((id): id is string => typeof id === 'string'));
  hints.forEach((hint) => {
    if (typeof hint.id === 'string' && typeof hint.focusId === 'string' && !focusIds.has(hint.focusId)) {
      errors.push(`hint ${hint.id} references missing item ${hint.focusId}.`);
    }
  });

  let decisionIds: string[] = [];
  let answerTarget: string | undefined;
  let answerLabel: string | undefined;
  if (!isRecord(value.answer)) {
    errors.push('answer must be an object.');
  } else {
    const answer = value.answer;
    const kindValid = DECISION_KINDS.includes(answer.kind as DecisionKind);
    if (!kindValid) errors.push('answer.kind is invalid.');
    if (requireString(errors, 'answer.targetId', answer.targetId)) answerTarget = answer.targetId;
    if (requireString(errors, 'answer.label', answer.label)) answerLabel = answer.label;
    if (kindValid) decisionIds = decisionIdsForKind(answer.kind as DecisionKind, suspects, statements, evidence, timeline);
  }

  if (answerTarget && !decisionIds.includes(answerTarget)) errors.push(`answer target ${answerTarget} does not exist.`);
  if (answerLabel && isNonEmptyString(value.explanation) && !value.explanation.toLocaleLowerCase().includes(answerLabel.toLocaleLowerCase())) {
    errors.push('explanation must name the correct answer.');
  }
  if (solutionCandidateIds.length !== 1 || !answerTarget || solutionCandidateIds[0] !== answerTarget) {
    errors.push('case must expose exactly one solution candidate matching the answer.');
  }

  if (value.source === 'generated') {
    const audit = value.generationAudit;
    if (!isRecord(audit)) {
      errors.push('generated case is missing its logic audit.');
    } else {
      const candidates = isRecord(audit.candidateSolutions) ? audit.candidateSolutions : null;
      if (!candidates) {
        errors.push('generated case audit candidateSolutions must be an object.');
      } else {
        if (!Object.values(candidates).every((candidate) => typeof candidate === 'boolean')) errors.push('generated case audit candidates must be booleans.');
        const auditedIds = Object.keys(candidates).sort();
        const expectedIds = [...decisionIds].sort();
        if (auditedIds.join('|') !== expectedIds.join('|')) errors.push('generated case audit must cover every decision target.');
        const validSolutions = auditedIds.filter((id) => candidates[id] === true);
        if (validSolutions.length !== 1 || validSolutions[0] !== answerTarget) errors.push('generated case audit does not prove one unique answer.');
      }
      if (audit.evidenceConsistent !== true) errors.push('generated evidence is internally inconsistent.');
      if (audit.distractorsPossible !== true) errors.push('generated distractors are not logically possible.');
      if (audit.derivableFromShownInformation !== true) errors.push('generated answer is not derivable from shown information.');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidCase(caseFile: CaseDefinition): CaseDefinition {
  const result = validateCase(caseFile);
  if (!result.valid) {
    const value = caseFile as unknown;
    const id = isRecord(value) && typeof value.id === 'string' ? value.id : 'unknown';
    throw new Error(`Invalid case "${id}": ${result.errors.join(' ')}`);
  }
  return caseFile;
}

export function parseCase(value: unknown): CaseDefinition {
  if (!isRecord(value)) throw new Error('Case payload must be an object.');
  return assertValidCase(value as unknown as CaseDefinition);
}
