import type { Chapter } from '@/types/game';

export const CHAPTERS: Chapter[] = [
  { id: 'small-crimes', number: 1, title: 'Small Crimes', subtitle: 'Learn to distrust the smallest detail.', requiredSolved: 0, difficulty: 'Beginner', caseIds: ['sc-vanished-violin', 'sc-clockwork-tip'] },
  { id: 'missing-objects', number: 2, title: 'Missing Objects', subtitle: 'Follow what moved and what was left behind.', requiredSolved: 2, difficulty: 'Easy', caseIds: ['mo-borrowed-brooch', 'mo-greenhouse-key'] },
  { id: 'locked-rooms', number: 3, title: 'Locked Rooms', subtitle: 'Doors remember what witnesses forget.', requiredSolved: 4, difficulty: 'Normal', caseIds: ['lr-sealed-study', 'lr-gallery-blackout'] },
  { id: 'false-alibis', number: 4, title: 'False Alibis', subtitle: 'Break stories built to survive first inspection.', requiredSolved: 6, difficulty: 'Hard', caseIds: ['fa-last-ferry', 'fa-silent-alarm'] },
  { id: 'midnight-cases', number: 5, title: 'Midnight Cases', subtitle: 'Read difficult timelines in the dark hours.', requiredSolved: 8, difficulty: 'Expert', caseIds: ['mc-rain-at-midnight', 'mc-last-train'] },
  { id: 'master-detectives', number: 6, title: 'Master Detectives', subtitle: 'Combine every trace. Assume nothing.', requiredSolved: 10, difficulty: 'Master', caseIds: ['md-five-minute-window', 'md-observatory-silence'] },
];
