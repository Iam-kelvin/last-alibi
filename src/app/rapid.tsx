import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CasePlayer, type SolvedSummary } from '@/components/case-player';
import { AppHeader, Body, Button, Card, Eyebrow, Metric, Screen, Title, useTextScale } from '@/components/ui';
import { generateCase } from '@/game/generator';
import { track } from '@/services/analytics';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';
import { DIFFICULTIES, type Difficulty } from '@/types/game';

const RAPID_SECONDS = 180;

export default function RapidScreen() {
  const [stage, setStage] = useState<'briefing' | 'running' | 'finished'>('briefing');
  const [sessionSeed, setSessionSeed] = useState('');
  const [caseIndex, setCaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(RAPID_SECONDS);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [bestAtStart, setBestAtStart] = useState(0);
  const [deadlineMs, setDeadlineMs] = useState(0);
  const finished = useRef(false);
  const scoreRef = useRef(0);
  const solvedRef = useRef(0);
  const { state, completeRapid } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const navigation = useNavigation();

  const finishSession = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    setStage('finished');
    const finalScore = scoreRef.current;
    const finalSolved = solvedRef.current;
    setScore(finalScore);
    setSolved(finalSolved);
    completeRapid(finalScore, finalSolved);
  }, [completeRapid]);

  useEffect(() => {
    if (stage !== 'running') return;
    return navigation.addListener('beforeRemove', (event) => {
      event.preventDefault();
      finishSession();
    });
  }, [finishSession, navigation, stage]);

  useEffect(() => {
    if (stage !== 'running') return;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds <= 0) finishSession();
    }, 250);
    return () => clearInterval(timer);
  }, [deadlineMs, finishSession, stage]);

  const difficulty: Difficulty = DIFFICULTIES[Math.min(3, Math.floor(caseIndex / 2))]!;
  const caseFile = useMemo(
    () => sessionSeed ? generateCase(`${sessionSeed}:case:${caseIndex}`, { rapid: true, difficulty }) : null,
    [caseIndex, difficulty, sessionSeed],
  );

  const start = () => {
    finished.current = false;
    const nextSeed = `rapid:${Date.now()}`;
    setSessionSeed(nextSeed);
    setCaseIndex(0);
    setRemaining(RAPID_SECONDS);
    setScore(0);
    setSolved(0);
    scoreRef.current = 0;
    solvedRef.current = 0;
    setBestAtStart(state.bestRapidScore);
    setDeadlineMs(Date.now() + RAPID_SECONDS * 1000);
    setStage('running');
    track('rapid_started');
  };

  const recordSolved = (summary: SolvedSummary) => {
    scoreRef.current += summary.record.score;
    solvedRef.current += 1;
    setScore(scoreRef.current);
    setSolved(solvedRef.current);
  };

  if (stage === 'running' && caseFile) {
    return (
      <CasePlayer
        key={caseFile.id}
        caseFile={caseFile}
        mode="rapid"
        showIntro={false}
        remainingSeconds={remaining}
        deadlineMs={deadlineMs}
        continueLabel="Next rapid case"
        onExit={finishSession}
        onExpired={finishSession}
        onSolved={recordSolved}
        onContinue={() => {
          if (remaining <= 0) finishSession();
          else setCaseIndex((value) => value + 1);
        }}
      />
    );
  }

  if (stage === 'finished') {
    const average = solved ? Math.round((RAPID_SECONDS - remaining) / solved) : 0;
    return (
      <Screen>
        <AppHeader title="Rapid Deduction" subtitle="Session complete" back={false} right={<Button label="Home" variant="ghost" compact onPress={() => router.replace('/')} />} />
        <View style={styles.finishHero}>
          <View style={[styles.rapidIcon, { backgroundColor: `${palette.crimson}20`, borderColor: palette.crimson }]}><Ionicons name="stopwatch" size={48} color={palette.crimson} /></View>
          <Eyebrow>Time called</Eyebrow>
          <Title style={styles.center}>{score.toLocaleString()} points</Title>
          <Body muted style={styles.center}>{solved ? `You closed ${solved} ${solved === 1 ? 'case' : 'cases'} under pressure.` : 'No case was closed this round. The next briefing is ready.'}</Body>
        </View>
        <View style={styles.metrics}>
          <Metric icon="checkmark-done" value={solved} label="Closed" />
          <Metric icon="time-outline" value={average ? `${average}s` : '—'} label="Avg case" />
          <Metric icon="trophy-outline" value={Math.max(score, state.bestRapidScore).toLocaleString()} label="Best" />
        </View>
        {score > bestAtStart ? (
          <Card style={[styles.bestCard, { borderColor: palette.gold }]}><Ionicons name="sparkles" size={23} color={palette.gold} /><Body>New personal best recorded.</Body></Card>
        ) : null}
        <Button label="Try another run" icon="refresh" onPress={start} style={styles.action} />
        <Button label="Return home" variant="secondary" onPress={() => router.replace('/')} style={styles.secondaryAction} />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Rapid Deduction" subtitle="Timed mode" />
      <View style={styles.hero}>
        <View style={[styles.rapidIcon, { backgroundColor: `${palette.crimson}20`, borderColor: palette.crimson }]}><Ionicons name="flash" size={48} color={palette.crimson} /></View>
        <Eyebrow>Three-minute challenge</Eyebrow>
        <Title style={styles.center}>Think fast. Stay precise.</Title>
        <Body muted style={styles.center}>Close as many compact cases as possible before time expires. The timer keeps running through results.</Body>
      </View>
      <Card paper>
        <Text style={[styles.rulesTitle, { color: palette.paperAccent, fontSize: 11 * scale }]}>RAPID RULES</Text>
        <Rule icon="time-outline" text="The session lasts exactly three minutes." />
        <Rule icon="trending-up-outline" text="Difficulty rises after every two closed cases." />
        <Rule icon="close-circle-outline" text="Wrong guesses and hints reduce each case score." />
        <Rule icon="pause-circle-outline" text="There is no pause once the first file opens." />
      </Card>
      <Button label="Start rapid session" icon="stopwatch-outline" onPress={start} style={styles.action} />
      <Body muted style={styles.bestText}>Personal best: {state.bestRapidScore.toLocaleString()} points</Body>
    </Screen>
  );
}

function Rule({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const palette = usePalette();
  return <View style={styles.rule}><Ionicons name={icon} size={20} color={palette.paperAccent} /><Text style={[styles.ruleText, { color: palette.paperText }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 30 },
  finishHero: { alignItems: 'center', paddingVertical: 38 },
  rapidIcon: { width: 94, height: 94, borderRadius: 47, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  center: { textAlign: 'center', maxWidth: 640, marginTop: 10 },
  rulesTitle: { fontWeight: '900', letterSpacing: 1.6, marginBottom: 11 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
  ruleText: { flex: 1, fontSize: 15, lineHeight: 21, fontWeight: '500' },
  action: { marginTop: 20 },
  secondaryAction: { marginTop: 10 },
  bestText: { textAlign: 'center', marginTop: 13 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bestCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 16 },
});

