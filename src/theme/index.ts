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
  paperAccent: string;
  success: string;
  warning: string;
  shadow: string;
}

export const NOIR: Palette = {
  background: '#12100D', surface: '#1B1814', elevated: '#25211C', paper: '#D6C6A4', paperText: '#211B15',
  border: '#3A3329', borderStrong: '#66553B', text: '#F3EBDD', muted: '#AAA08F', gold: '#D2A85D', goldSoft: '#7C633A',
  crimson: '#E07168', paperAccent: '#7A241F', success: '#78A982', warning: '#D38A55', shadow: '#050403',
};

export const MIDNIGHT: Palette = {
  ...NOIR, background: '#090D13', surface: '#111823', elevated: '#182230', paper: '#CED7DF', paperText: '#101720',
  border: '#263549', borderStrong: '#45617C', muted: '#A9B4BF', gold: '#AFC8DA', goldSoft: '#526D82', crimson: '#E27882', paperAccent: '#792B34',
};

export const DAYLIGHT: Palette = {
  background: '#F3EBDD', surface: '#FFF9EF', elevated: '#E8DCC8', paper: '#D6C6A4', paperText: '#211B15',
  border: '#C3B496', borderStrong: '#8A785C', text: '#211B15', muted: '#665E52', gold: '#765316', goldSoft: '#A98B55',
  crimson: '#872E29', paperAccent: '#76251F', success: '#3D714B', warning: '#8A4F24', shadow: '#4A3D2A',
};

export function usePalette(): Palette {
  const { state } = useGame();
  const scheme = useColorScheme();
  if (state.settings.theme === 'midnight') return MIDNIGHT;
  if (state.settings.theme === 'system' && scheme === 'light') {
    return DAYLIGHT;
  }
  return NOIR;
}

export function textScale(preference: TextSizePreference): number {
  if (preference === 'large') return 1.12;
  if (preference === 'extra-large') return 1.25;
  return 1;
}
