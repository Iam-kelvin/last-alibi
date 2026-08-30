import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { CasePlayer } from '@/components/case-player';
import { Button, EmptyState, Screen } from '@/components/ui';
import { CURATED_CASE_MAP } from '@/data/curated-cases';
import { getDailyCase } from '@/game/daily';
import { generateCase } from '@/game/generator';
import { useGame } from '@/state/game-context';
import type { GameMode } from '@/types/game';

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function CaseRoute() {
  const params = useLocalSearchParams<{ id: string; mode?: string; seed?: string; dateKey?: string }>();
  const { state, advanceEndless } = useGame();
  const id = first(params.id);
  const modeValue = first(params.mode);
  const seed = first(params.seed);
  const dateKey = first(params.dateKey);
  const mode: GameMode = modeValue === 'daily' || modeValue === 'endless' || modeValue === 'rapid' ? modeValue : 'case-files';
  const caseFile = useMemo(() => {
    if (id && CURATED_CASE_MAP[id]) return CURATED_CASE_MAP[id];
    if (mode === 'daily' && dateKey) return getDailyCase(dateKey);
    if (seed) return generateCase(seed);
    return undefined;
  }, [dateKey, id, mode, seed]);

  if (!caseFile) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Case file unavailable"
          message="This route does not contain a bundled case or a reproducible seed."
          action={<Button label="Return home" onPress={() => router.replace('/')} />}
        />
      </Screen>
    );
  }

  return (
    <CasePlayer
      key={caseFile.id}
      caseFile={caseFile}
      mode={mode}
      dateKey={dateKey}
      continueLabel={mode === 'daily' ? 'Return to daily desk' : mode === 'endless' ? 'Open next generated case' : 'Return to case files'}
      onExit={() => router.back()}
      onContinue={() => {
        if (mode === 'daily') router.replace('/daily');
        else if (mode === 'endless') {
          const nextCounter = state.endlessCounter + 1;
          const nextSeed = `endless-${nextCounter}`;
          advanceEndless();
          router.replace({ pathname: '/case/[id]', params: { id: generateCase(nextSeed).id, mode: 'endless', seed: nextSeed } });
        } else router.replace('/case-files');
      }}
    />
  );
}
