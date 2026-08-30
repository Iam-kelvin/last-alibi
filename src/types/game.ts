export const DIFFICULTIES = [
  'Beginner',
  'Easy',
  'Normal',
  'Hard',
  'Expert',
  'Master',
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const CASE_TYPES = [
  'Liar',
  'Broken Alibi',
  'Impossible Evidence',
  'Who Did It?',
  'Timeline',
  'Missing Detail',
] as const;

export type CaseType = (typeof CASE_TYPES)[number];
export type DecisionKind = 'suspect' | 'statement' | 'evidence' | 'timeline';
export type GameMode = 'case-files' | 'daily' | 'endless' | 'rapid';

export interface Suspect {
  id: string;
  name: string;
  role: string;
  description: string;
  accent: string;
}

export interface Statement {
  id: string;
  suspectId: string;
  title: string;
  text: string;
}

export interface Evidence {
  id: string;
  title: string;
  type:
    | 'record'
    | 'object'
    | 'message'
    | 'weather'
    | 'photo'
    | 'map'
    | 'witness';
  description: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface CaseHint {
  id: string;
  text: string;
  focusId?: string;
}

export interface CaseAnswer {
  kind: DecisionKind;
  targetId: string;
  label: string;
}

export interface CaseDefinition {
  id: string;
  version: number;
  source: 'curated' | 'generated';
  title: string;
  location: string;
  chapterId?: string;
  difficulty: Difficulty;
  type: CaseType;
  introduction: string;
  objective: string;
  decisionPrompt: string;
  suspects: Suspect[];
  statements: Statement[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  answer: CaseAnswer;
  explanation: string;
  contradiction: string;
  hints: CaseHint[];
  tags: string[];
  estimatedSeconds: number;
  /** A generator-provided proof surface. There must be exactly one valid target. */
  solutionCandidateIds: string[];
  generationAudit?: {
    candidateSolutions: Record<string, boolean>;
    evidenceConsistent: boolean;
    distractorsPossible: boolean;
    derivableFromShownInformation: boolean;
  };
}

export interface CasePerformance {
  score: number;
  elapsedSeconds: number;
  wrongGuesses: number;
  hintsUsed: number;
  firstTry: boolean;
}

export interface CompletionRecord extends CasePerformance {
  caseId: string;
  caseType: CaseType;
  difficulty: Difficulty;
  mode: GameMode;
  completedAt: string;
  xpEarned: number;
}

export interface DailyResult extends CompletionRecord {
  dateKey: string;
  official: true;
}

export interface PlayerStats {
  casesStarted: number;
  casesSolved: number;
  firstTrySolves: number;
  totalWrongGuesses: number;
  totalHintsUsed: number;
  totalSolveSeconds: number;
  byType: Record<CaseType, number>;
}

export type ThemePreference = 'noir' | 'midnight' | 'system';
export type TextSizePreference = 'standard' | 'large' | 'extra-large';

export interface PlayerSettings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  theme: ThemePreference;
  reducedMotion: boolean;
  textSize: TextSizePreference;
}

export interface PlayerState {
  schemaVersion: number;
  hydrated: boolean;
  tutorialCompleted: boolean;
  xp: number;
  completedCases: Record<string, CompletionRecord>;
  unlockedChapterIds: string[];
  dailyResults: Record<string, DailyResult>;
  currentDailyStreak: number;
  longestDailyStreak: number;
  bestRapidScore: number;
  stats: PlayerStats;
  unlockedAchievements: Record<string, string>;
  settings: PlayerSettings;
  endlessCounter: number;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  requiredSolved: number;
  difficulty: Difficulty;
  caseIds: string[];
}

export interface ScoreBreakdown {
  base: number;
  difficultyBonus: number;
  firstTryBonus: number;
  noHintBonus: number;
  speedBonus: number;
  wrongGuessPenalty: number;
  hintPenalty: number;
  timePenalty: number;
  total: number;
}
