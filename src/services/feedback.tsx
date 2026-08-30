import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren } from 'react';

import { reportError } from '@/services/analytics';
import { useGame } from '@/state/game-context';

function configureAmbient(player: ReturnType<typeof useAudioPlayer>): void {
  player.loop = true;
  player.volume = 0.22;
}

export type FeedbackEffect = 'tap' | 'clue' | 'correct' | 'incorrect' | 'achievement';

interface FeedbackContextValue {
  play(effect: FeedbackEffect): void;
}

const FeedbackContext = createContext<FeedbackContextValue>({ play: () => undefined });

export function FeedbackProvider({ children }: PropsWithChildren) {
  const { state } = useGame();
  const knownAchievements = useRef<Set<string> | null>(null);
  const tap = useAudioPlayer(require('../../assets/audio/tap.wav'));
  const clue = useAudioPlayer(require('../../assets/audio/clue.wav'));
  const correct = useAudioPlayer(require('../../assets/audio/correct.wav'));
  const incorrect = useAudioPlayer(require('../../assets/audio/incorrect.wav'));
  const achievement = useAudioPlayer(require('../../assets/audio/achievement.wav'));
  const ambient = useAudioPlayer(require('../../assets/audio/ambient.wav'));

  useEffect(() => {
    configureAmbient(ambient);
    try {
      if (state.settings.music) ambient.play();
      else ambient.pause();
    } catch (error) {
      // Browsers may block autoplay until the first gesture; game audio remains optional.
      if (__DEV__) reportError(error, { operation: 'ambient_audio' });
    }
  }, [ambient, state.settings.music]);

  const players = useMemo(() => ({ tap, clue, correct, incorrect, achievement }), [tap, clue, correct, incorrect, achievement]);

  const play = useCallback((effect: FeedbackEffect) => {
    if (state.settings.music && !ambient.playing) {
      try { ambient.play(); } catch { /* Web may still reject playback without permission. */ }
    }
    if (state.settings.sound) {
      const player = players[effect];
      player.seekTo(0).then(() => player.play()).catch((error) => reportError(error, { operation: 'sound_effect', effect }));
    }
    if (state.settings.haptics) {
      const feedback = effect === 'correct' || effect === 'achievement'
        ? Haptics.NotificationFeedbackType.Success
        : effect === 'incorrect'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning;
      Haptics.notificationAsync(feedback).catch(() => undefined);
    }
  }, [ambient, players, state.settings.haptics, state.settings.music, state.settings.sound]);

  useEffect(() => {
    if (!state.hydrated) return;
    const current = new Set(Object.keys(state.unlockedAchievements));
    if (knownAchievements.current && [...current].some((id) => !knownAchievements.current!.has(id))) {
      play('achievement');
    }
    knownAchievements.current = current;
  }, [play, state.hydrated, state.unlockedAchievements]);

  return <FeedbackContext.Provider value={{ play }}>{children}</FeedbackContext.Provider>;
}

export function useFeedback(): FeedbackContextValue {
  return useContext(FeedbackContext);
}
