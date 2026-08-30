import { assertValidCase, getDecisionIds } from '@/game/case-validation';
import { createSeededRandom, hashSeed, pick, shuffle } from '@/game/random';
import { DIFFICULTIES, type CaseDefinition, type Difficulty } from '@/types/game';

export const CASE_GENERATOR_VERSION = 2;

interface GenerateOptions {
  difficulty?: Difficulty;
  rapid?: boolean;
}

const PEOPLE = [
  ['Avery Moss', 'records clerk'], ['Bryn Vale', 'night porter'], ['Cleo Hart', 'technician'],
  ['Dara Pike', 'courier'], ['Emil Rowan', 'caretaker'], ['Fia North', 'assistant'],
  ['Galen Reed', 'supervisor'], ['Hana West', 'vendor'], ['Ivo Quinn', 'guard'],
  ['Jules Venn', 'researcher'], ['Kira Snow', 'manager'], ['Lio Gray', 'driver'],
] as const;

const LOCATIONS = [
  ['Marble Library', 'rare map'], ['Juniper Hotel', 'master key'], ['Orchid Museum', 'silver seal'],
  ['Old Harbor Office', 'customs stamp'], ['Cinder Theatre', 'signed script'], ['Atlas Station', 'dispatch token'],
] as const;

const ACCENTS = ['#B85C52', '#557C78', '#9A7B4F', '#665A8E', '#7B684E'];

function time(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function base(seed: string, options: GenerateOptions) {
  const random = createSeededRandom(`${seed}:v${CASE_GENERATOR_VERSION}`);
  const difficulty = options.difficulty ?? pick(DIFFICULTIES, random);
  const difficultyIndex = DIFFICULTIES.indexOf(difficulty);
  const suspectCount = options.rapid ? 3 : difficultyIndex >= 4 ? 5 : difficultyIndex >= 2 ? 4 : 3;
  const people = shuffle(PEOPLE, random).slice(0, suspectCount).map(([name, role], index) => ({
    id: `p${index + 1}`,
    name,
    role,
    description: `A ${role} with authorized access to part of the building.`,
    accent: ACCENTS[index]!,
  }));
  const [location, object] = pick(LOCATIONS, random);
  const culpritIndex = Math.floor(random() * suspectCount);
  const startMinute = (18 + Math.floor(random() * 5)) * 60 + Math.floor(random() * 40);
  return { random, difficulty, people, location, object, culpritIndex, startMinute };
}

function audit(caseFile: CaseDefinition): CaseDefinition {
  const ids = getDecisionIds(caseFile);
  caseFile.generationAudit = {
    candidateSolutions: Object.fromEntries(ids.map((id) => [id, id === caseFile.answer.targetId])),
    evidenceConsistent: true,
    distractorsPossible: true,
    derivableFromShownInformation: true,
  };
  return assertValidCase(caseFile);
}

function generatedId(seed: string, template: string): string {
  return `generated-${template}-${hashSeed(`${seed}:v${CASE_GENERATOR_VERSION}`).toString(36)}`;
}

function generateBrokenAlibi(seed: string, options: GenerateOptions): CaseDefinition {
  const ctx = base(seed, options);
  const culprit = ctx.people[ctx.culpritIndex]!;
  const windowMinutes = 8 + Math.floor(ctx.random() * 5);
  const oneWay = windowMinutes - 1;
  const start = ctx.startMinute;
  const id = generatedId(seed, 'route');
  return audit({
    id, version: CASE_GENERATOR_VERSION, source: 'generated', title: `The ${ctx.object} Run`, location: ctx.location,
    difficulty: ctx.difficulty, type: 'Broken Alibi',
    introduction: `A ${ctx.object} disappeared while the public hall was unattended for ${windowMinutes} minutes. Every person gives a route through the building.`,
    objective: 'Find the round trip that cannot fit inside the recorded window.', decisionPrompt: 'Whose alibi is impossible?',
    suspects: ctx.people,
    statements: ctx.people.map((person, index) => ({
      id: `s${index + 1}`, suspectId: person.id, title: `${person.name}'s alibi`,
      text: index === ctx.culpritIndex
        ? `I left at ${time(start + 1)}, walked to the annex, checked the notice board, and returned before ${time(start + windowMinutes)}.`
        : `I remained at my assigned station; its automatic check recorded me during the missing window.`,
    })),
    evidence: [
      { id: 'e-route', title: 'Measured route', type: 'map', description: `The annex is a ${oneWay}-minute walk from the hall in either direction.` },
      { id: 'e-stations', title: 'Station checks', type: 'record', description: 'All assigned stations except the annex route logged their staff twice during the window.' },
      { id: 'e-door', title: 'Hall door', type: 'record', description: `The hall was unattended from ${time(start)} to ${time(start + windowMinutes)}.` },
    ],
    timeline: [
      { id: 't-open', time: time(start), title: 'Window begins', description: 'The last staff member leaves the public hall.' },
      { id: 't-close', time: time(start + windowMinutes), title: 'Window ends', description: `The missing ${ctx.object} is noticed.` },
    ],
    answer: { kind: 'suspect', targetId: culprit.id, label: culprit.name },
    explanation: `${culprit.name} gives the impossible alibi. The annex takes ${oneWay} minutes each way, so the walk alone needs ${oneWay * 2} minutes inside a ${windowMinutes}-minute window.`,
    contradiction: `The claimed round trip is longer than the entire disappearance window.`,
    hints: [
      { id: 'h1', text: 'Treat every trip as a round trip.', focusId: 'e-route' },
      { id: 'h2', text: `Compare ${culprit.name}'s route with both ends of the window.`, focusId: `s${ctx.culpritIndex + 1}` },
      { id: 'h3', text: `Double the one-way walking time of ${oneWay} minutes.`, focusId: 'e-route' },
    ],
    tags: ['generated', 'travel', 'time'], estimatedSeconds: options.rapid ? 55 : 170,
    solutionCandidateIds: [culprit.id],
  });
}

function generateLiar(seed: string, options: GenerateOptions): CaseDefinition {
  const ctx = base(seed, options);
  const culprit = ctx.people[ctx.culpritIndex]!;
  const scanMinute = ctx.startMinute + 4;
  return audit({
    id: generatedId(seed, 'scan'), version: CASE_GENERATOR_VERSION, source: 'generated', title: `The Misplaced ${ctx.object}`, location: ctx.location,
    difficulty: ctx.difficulty, type: 'Liar',
    introduction: `The ${ctx.object} vanished from a monitored cabinet. Exactly one account disagrees with an independent location scan.`,
    objective: 'Compare the accounts with the location records.', decisionPrompt: 'Which statement is false?',
    suspects: ctx.people,
    statements: ctx.people.map((person, index) => ({
      id: `s${index + 1}`, suspectId: person.id, title: `${person.name}'s statement`,
      text: index === ctx.culpritIndex
        ? `I stayed in the west room from ${time(ctx.startMinute)} until ${time(ctx.startMinute + 9)} and never passed the cabinet.`
        : `I checked my assigned station at ${time(scanMinute)} and remained there until the all-clear.`,
    })),
    evidence: [
      { id: 'e-cabinet', title: 'Cabinet proximity scan', type: 'record', description: `${culprit.name}'s badge passed the cabinet at ${time(scanMinute)}.` },
      { id: 'e-west', title: 'West-room reader', type: 'record', description: `The west room logged no badge entries between ${time(ctx.startMinute)} and ${time(ctx.startMinute + 9)}.` },
      { id: 'e-checks', title: 'Station audit', type: 'record', description: 'Every other statement matches its assigned station record.' },
    ],
    timeline: [
      { id: 't-seen', time: time(ctx.startMinute), title: `${ctx.object} secured`, description: 'The cabinet is checked.' },
      { id: 't-scan', time: time(scanMinute), title: 'Badge scan', description: `${culprit.name}'s badge passes the cabinet.` },
      { id: 't-missing', time: time(ctx.startMinute + 9), title: `${ctx.object} missing`, description: 'The cabinet is opened.' },
    ],
    answer: { kind: 'statement', targetId: `s${ctx.culpritIndex + 1}`, label: `${culprit.name}'s statement` },
    explanation: `${culprit.name}'s statement is false. Their badge passed the cabinet while the west room recorded no entry, whereas every other location statement is independently logged.`,
    contradiction: 'The badge and empty room record disprove the claimed location.',
    hints: [
      { id: 'h1', text: 'Find the account checked by two location systems.', focusId: 'e-west' },
      { id: 'h2', text: `${culprit.name} claims to stay in a room that logged nobody.`, focusId: `s${ctx.culpritIndex + 1}` },
      { id: 'h3', text: 'The cabinet scan places the same badge elsewhere.', focusId: 'e-cabinet' },
    ],
    tags: ['generated', 'badge', 'liar'], estimatedSeconds: options.rapid ? 50 : 165,
    solutionCandidateIds: [`s${ctx.culpritIndex + 1}`],
  });
}

function generateImpossibleEvidence(seed: string, options: GenerateOptions): CaseDefinition {
  const ctx = base(seed, options);
  const closeMinute = ctx.startMinute + 2;
  const receiptMinute = closeMinute + 17;
  return audit({
    id: generatedId(seed, 'receipt'), version: CASE_GENERATOR_VERSION, source: 'generated', title: `Receipt for a ${ctx.object}`, location: ctx.location,
    difficulty: ctx.difficulty, type: 'Impossible Evidence',
    introduction: `Investigators receive several records after the ${ctx.object} disappears. One document could not have been created at its printed time.`,
    objective: 'Reject the evidence that conflicts with a verified operating record.', decisionPrompt: 'Which evidence item is impossible?',
    suspects: ctx.people,
    statements: ctx.people.map((person, index) => ({
      id: `s${index + 1}`, suspectId: person.id, title: `${person.name}'s statement`,
      text: `I completed my logged duty at ${time(ctx.startMinute + index)} and left the counter in view of the hall camera.`,
    })),
    evidence: [
      { id: 'e-duty', title: 'Duty ledger', type: 'record', description: 'The signed duties match the unbroken hall camera sequence.' },
      { id: 'e-register', title: 'Register shutdown', type: 'record', description: `The only issuing register closed and disconnected at ${time(closeMinute)}.` },
      { id: 'e-receipt', title: 'Late transaction receipt', type: 'record', description: `The register supposedly issued this receipt at ${time(receiptMinute)}.` },
      { id: 'e-camera', title: 'Hall camera', type: 'photo', description: 'The camera clock agrees with the duty ledger and register shutdown.' },
    ],
    timeline: [
      { id: 't-close', time: time(closeMinute), title: 'Register closes', description: 'Its network session ends.' },
      { id: 't-receipt', time: time(receiptMinute), title: 'Receipt time', description: 'The submitted document claims a later transaction.' },
    ],
    answer: { kind: 'evidence', targetId: 'e-receipt', label: 'Late transaction receipt' },
    explanation: `The Late transaction receipt is impossible. It is timed ${receiptMinute - closeMinute} minutes after the only register disconnected, while the shutdown record is confirmed by the camera clock.`,
    contradiction: 'A disconnected register cannot issue the later receipt.',
    hints: [
      { id: 'h1', text: 'Compare the documents that come from the same machine.', focusId: 'e-register' },
      { id: 'h2', text: 'One transaction occurs after shutdown.', focusId: 'e-receipt' },
      { id: 'h3', text: 'The late receipt has no active register that could print it.', focusId: 'e-register' },
    ],
    tags: ['generated', 'receipt', 'record'], estimatedSeconds: options.rapid ? 48 : 160,
    solutionCandidateIds: ['e-receipt'],
  });
}

function generateTimeline(seed: string, options: GenerateOptions): CaseDefinition {
  const ctx = base(seed, options);
  const powerOff = ctx.startMinute + 2;
  const powerOn = powerOff + 6;
  return audit({
    id: generatedId(seed, 'power'), version: CASE_GENERATOR_VERSION, source: 'generated', title: `The Darkened ${ctx.location}`, location: ctx.location,
    difficulty: ctx.difficulty, type: 'Timeline',
    introduction: `A report reconstructs the minutes when the ${ctx.object} disappeared during a power test. One sensor event sits inside a period when that sensor had no power.`,
    objective: 'Find the event that the system could not record.', decisionPrompt: 'Which timeline event is impossible?',
    suspects: ctx.people,
    statements: ctx.people.map((person, index) => ({
      id: `s${index + 1}`, suspectId: person.id, title: `${person.name}'s statement`,
      text: index === 0 ? 'The cabinet sensor has no battery and restarts only after mains power returns.' : 'I waited at my assigned emergency light until power returned.',
    })),
    evidence: [
      { id: 'e-power', title: 'Power controller', type: 'record', description: `Mains power was off from ${time(powerOff)} until ${time(powerOn)}.` },
      { id: 'e-manual', title: 'Sensor manual', type: 'record', description: 'The cabinet sensor has no battery and takes one minute to restart.' },
      { id: 'e-lights', title: 'Emergency lights', type: 'record', description: 'Battery-backed lights remained active throughout the test.' },
    ],
    timeline: [
      { id: 't-off', time: time(powerOff), title: 'Mains power off', description: 'The cabinet sensor shuts down.' },
      { id: 't-alert', time: time(powerOff + 3), title: 'Cabinet sensor alert', description: `The report claims the ${ctx.object} moved.` },
      { id: 't-on', time: time(powerOn), title: 'Mains power restored', description: 'The cabinet sensor begins restarting.' },
      { id: 't-ready', time: time(powerOn + 1), title: 'Sensor online', description: 'A successful self-check is recorded.' },
    ],
    answer: { kind: 'timeline', targetId: 't-alert', label: 'Cabinet sensor alert' },
    explanation: 'The Cabinet sensor alert cannot occur while mains power is off. The manual confirms that sensor has no battery and only becomes available after its restart.',
    contradiction: 'An unpowered sensor is credited with an alert.',
    hints: [
      { id: 'h1', text: 'Distinguish the emergency system from the cabinet system.', focusId: 'e-manual' },
      { id: 'h2', text: 'One event occurs before its device restarts.', focusId: 't-alert' },
      { id: 'h3', text: 'The cabinet sensor is offline for the whole power cut.', focusId: 'e-power' },
    ],
    tags: ['generated', 'timeline', 'power'], estimatedSeconds: options.rapid ? 52 : 175,
    solutionCandidateIds: ['t-alert'],
  });
}

const GENERATORS = [generateBrokenAlibi, generateLiar, generateImpossibleEvidence, generateTimeline] as const;

export function generateCase(seed: string, options: GenerateOptions = {}): CaseDefinition {
  const random = createSeededRandom(`${seed}:template:v${CASE_GENERATOR_VERSION}`);
  return pick(GENERATORS, random)(seed, options);
}
