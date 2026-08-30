import { useColorScheme } from 'react-native';

import { useGame } from '@/state/game-context';
import type { TextSizePreference } from '@/types/game';

export interface Palette {
  background: string;
  surface: string;
  elevated: string;
  paper: string;
  paperText: string;
  border: string;
  borderStrong: string;
  text: string;
  muted: string;
  gold: string;
  goldSoft: string;
  crimson: string;
  success: string;
  warning: string;
  shadow: string;
}

export const NOIR: Palette = {
  background: '#12100D', surface: '#1B1814', elevated: '#25211C', paper: '#D6C6A4', paperText: '#211B15',
  border: '#3A3329', borderStrong: '#66553B', text: '#F3EBDD', muted: '#AAA08F', gold: '#D2A85D', goldSoft: '#7C633A',
  crimson: '#A9433B', success: '#6F9B77', warning: '#C47D4B', shadow: '#050403',
};

export const MIDNIGHT: Palette = {
  ...NOIR, background: '#090D13', surface: '#111823', elevated: '#182230', paper: '#CED7DF', paperText: '#101720',
  border: '#263549', borderStrong: '#45617C', muted: '#91A0AF', gold: '#9EB8CB', goldSoft: '#526D82', crimson: '#A94D58',
};

export function usePalette(): Palette {
  const { state } = useGame();
  const scheme = useColorScheme();
  if (state.settings.theme === 'midnight') return MIDNIGHT;
  if (state.settings.theme === 'system' && scheme === 'light') {
    return { ...NOIR, background: '#211D18', surface: '#2A251E', elevated: '#342E25' };
  }
  return NOIR;
}

export function textScale(preference: TextSizePreference): number {
  if (preference === 'large') return 1.12;
  if (preference === 'extra-large') return 1.25;
  return 1;
}
