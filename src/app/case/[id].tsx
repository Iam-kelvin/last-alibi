import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { CasePlayer } from '@/components/case-player';
import { Button, EmptyState, Screen } from '@/components/ui';
import { CHAPTERS } from '@/data/chapters';
import { CURATED_CASE_MAP } from '@/data/curated-cases';
import { getDailyCase } from '@/game/daily';
import { generateUnlockedCase } from '@/game/generator';
import { getLocalDateKey } from '@/game/progression';
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
  const unlockedDifficulties = useMemo(
    () => CHAPTERS.filter((chapter) => state.unlockedChapterIds.includes(chapter.id)).map((chapter) => chapter.difficulty),
    [state.unlockedChapterIds],
  );
  const requestedChapter = id ? CHAPTERS.find((chapter) => chapter.caseIds.includes(id)) : undefined;
  const curatedAllowed = !requestedChapter || state.unlockedChapterIds.includes(requestedChapter.id);
  const validDailyDate = dateKey === getLocalDateKey();
  const caseFile = useMemo(() => {
    if (mode === 'daily') return dateKey && validDailyDate ? getDailyCase(dateKey) : undefined;
    if (mode === 'endless') return seed ? generateUnlockedCase(seed, unlockedDifficulties) : undefined;
    if (id && CURATED_CASE_MAP[id] && curatedAllowed) return CURATED_CASE_MAP[id];
    return undefined;
  }, [curatedAllowed, dateKey, id, mode, seed, unlockedDifficulties, validDailyDate]);

  if (!state.tutorialCompleted) return <Redirect href="/onboarding" />;

  if (!caseFile) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Case file unavailable"
          message={!curatedAllowed ? 'Close the earlier chapter files before opening this case.' : mode === 'daily' && !validDailyDate ? 'Only today’s Daily Case can be recorded as an official result.' : 'This route does not contain an available bundled case or reproducible seed.'}
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
      onExit={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }}
      onContinue={() => {
        if (mode === 'daily') router.replace('/daily');
        else if (mode === 'endless') {
          const nextCounter = state.endlessCounter + 1;
          const nextSeed = `endless-${nextCounter}`;
          advanceEndless();
          router.replace({ pathname: '/case/[id]', params: { id: generateUnlockedCase(nextSeed, unlockedDifficulties).id, mode: 'endless', seed: nextSeed } });
        } else router.replace('/case-files');
      }}
    />
  );
}
