import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Card, Eyebrow, ProgressBar, Screen, Title, useTextScale } from '@/components/ui';
import { track } from '@/services/analytics';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

const STEPS = [
  {
    eyebrow: 'Welcome, detective', title: 'Every detail can testify.',
    body: 'Read a compact case, inspect each account, and find the single conclusion that cannot be true.',
    icon: 'search-outline' as const,
    exampleTitle: 'The setup', example: 'A key vanished between 20:00 and 20:08. Three people claim they never crossed the lobby.',
  },
  {
    eyebrow: 'Build your case', title: 'Compare, mark, connect.',
    body: 'Move between People, Evidence, and Timeline. Bookmark suspicious items; they stay together in your lightweight Notes board.',
    icon: 'git-compare-outline' as const,
    exampleTitle: 'The contradiction', example: 'A receipt says 20:05. The only register shut down at 19:50. Both facts cannot be true.',
  },
  {
    eyebrow: 'Make the call', title: 'Wrong guesses are not the end.',
    body: 'Choose a suspect, statement, clue, or event. Wrong guesses lower your score, and escalating hints can point you back to the evidence.',
    icon: 'finger-print-outline' as const,
    exampleTitle: 'Scoring', example: 'Start at 1,000 points. Solve first try, use no hints, and move quickly for bonuses.',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { completeTutorial } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const current = STEPS[step]!;

  useEffect(() => { track('tutorial_started'); }, []);
  useEffect(() => { AccessibilityInfo.announceForAccessibility(`Briefing ${step + 1} of ${STEPS.length}. ${current.title}`); }, [current.title, step]);

  const next = () => {
    if (step < STEPS.length - 1) setStep((value) => value + 1);
    else {
      completeTutorial();
      router.replace('/');
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.progressTop}>
        <Text style={[styles.stepLabel, { color: palette.muted, fontSize: 11 * scale }]}>BRIEFING {step + 1} OF {STEPS.length}</Text>
        <ProgressBar value={(step + 1) / STEPS.length} accessibilityLabel={`Briefing ${step + 1} of ${STEPS.length}`} />
      </View>
      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: `${palette.gold}18`, borderColor: palette.goldSoft }]}>
          <Ionicons name={current.icon} size={52} color={palette.gold} />
        </View>
        <Eyebrow>{current.eyebrow}</Eyebrow>
        <Title style={styles.center}>{current.title}</Title>
        <Body muted style={styles.center}>{current.body}</Body>
      </View>
      <Card paper style={styles.exampleCard}>
        <Text style={[styles.exampleLabel, { color: palette.paperAccent, fontSize: 11 * scale }]}>{current.exampleTitle.toUpperCase()}</Text>
        <Text style={[styles.exampleText, { color: palette.paperText, fontSize: 17 * scale, lineHeight: 25 * scale }]}>{current.example}</Text>
      </Card>
      <View style={styles.actions}>
        {step > 0 ? <Button label="Back" variant="ghost" onPress={() => setStep((value) => value - 1)} style={styles.actionButton} /> : <View style={styles.actionButton} />}
        <Button label={step === STEPS.length - 1 ? 'Start investigating' : 'Continue'} icon="arrow-forward" onPress={next} style={styles.actionButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'space-between', paddingTop: 24, minHeight: 620 },
  progressTop: { gap: 9 },
  stepLabel: { fontWeight: '800', letterSpacing: 1.6 },
  hero: { alignItems: 'center', marginVertical: 34 },
  icon: { width: 102, height: 102, borderRadius: 51, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  center: { textAlign: 'center', maxWidth: 600, marginTop: 11 },
  exampleCard: { maxWidth: 650, width: '100%', alignSelf: 'center' },
  exampleLabel: { fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  exampleText: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  actionButton: { flex: 1 },
});

