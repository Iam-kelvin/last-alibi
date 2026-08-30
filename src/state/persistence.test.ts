import { describe, expect, it } from 'vitest';

import { deserializePlayerState } from '@/state/persistence';

describe('persistence migration', () => {
  it('falls back safely for corrupt data', () => {
    const state = deserializePlayerState('{broken');
    expect(state.hydrated).toBe(true);
    expect(state.xp).toBe(0);
  });

  it('merges partial saved state with current defaults', () => {
    const state = deserializePlayerState(JSON.stringify({ xp: 3200, tutorialCompleted: true, settings: { sound: false } }));
    expect(state.xp).toBe(3200);
    expect(state.tutorialCompleted).toBe(true);
    expect(state.settings.sound).toBe(false);
    expect(state.settings.haptics).toBe(true);
    expect(state.stats.byType.Timeline).toBe(0);
  });
});
