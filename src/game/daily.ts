import { generateCase, CASE_GENERATOR_VERSION } from '@/game/generator';
import { getLocalDateKey } from '@/game/progression';
import type { CaseDefinition } from '@/types/game';

export function getDailySeed(dateKey = getLocalDateKey()): string {
  return `daily:${dateKey}:case-version:${CASE_GENERATOR_VERSION}`;
}

export function getDailyCase(dateKey = getLocalDateKey()): CaseDefinition {
  return generateCase(getDailySeed(dateKey));
}
