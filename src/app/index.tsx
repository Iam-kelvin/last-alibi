import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Body, Card, LoadingState, Metric, ProgressBar, Screen, SectionTitle, Title, useTextScale } from '@/components/ui';
import { getDailyCase } from '@/game/daily';
import { getLevelProgress, getLocalDateKey, getPlayerLevel } from '@/game/progression';
import { useFeedback } from '@/services/feedback';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

export default function HomeScreen() {
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  const { state } = useGame();

  if (!state.hydrated) return <Screen scroll={false}><LoadingState label="Restoring your case files…" /></Screen>;
  if (!state.tutorialCompleted) return <Redirect href="/onboarding" />;

  const level = getPlayerLevel(state.xp);
  const levelProgress = getLevelProgress(state.xp);
  const dateKey = getLocalDateKey();
  const daily = getDailyCase(dateKey);
  const dailyComplete = Boolean(state.dailyResults[dateKey]);
  const accuracy = state.stats.casesSolved
    ? Math.round((state.stats.casesSolved / (state.stats.casesSolved + state.stats.totalWrongGuesses)) * 100)
    : 0;

  return (
    <Screen>
      <View style={styles.homeHeader}>
        <View style={styles.brandRow}>
          <Image source={require('../../assets/images/last-alibi-mark.png')} style={styles.brandMark} contentFit="cover" accessibilityLabel="The Last Alibi evidence-file emblem" />
          <View style={styles.brandCopy}>
            <Text style={[styles.brandKicker, { color: palette.gold, fontSize: 10 * scale }]}>DEDUCTION FILES</Text>
            <Title style={styles.brandTitle}>The Last Alibi</Title>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => { feedback.play('tap'); router.push('/settings'); }}
            style={[styles.settingsButton, { borderColor: palette.border, backgroundColor: palette.surface }]}
          >
            <Ionicons name="settings-outline" size={22} color={palette.text} />
          </Pressable>
        </View>

        <Card style={styles.levelCard}>
          <View style={styles.levelTop}>
            <View>
              <Text style={[styles.levelLabel, { color: palette.muted, fontSize: 10 * scale }]}>DETECTIVE LEVEL</Text>
              <Text style={[styles.levelValue, { color: palette.text, fontSize: 26 * scale }]}>Level {level}</Text>
            </View>
            <Badge label={`${state.xp.toLocaleString()} XP`} tone="gold" />
          </View>
          <ProgressBar value={levelProgress.ratio} accessibilityLabel={`${levelProgress.current} of ${levelProgress.required} XP toward next level`} />
          <Text style={[styles.levelProgressText, { color: palette.muted, fontSize: 11 * scale }]}>{levelProgress.required - levelProgress.current} XP to next level</Text>
        </Card>
      </View>

      <SectionTitle>Choose a case file</SectionTitle>
      <View style={styles.modeGrid}>
        <ModeCard title="Case Files" subtitle="Six chapters of curated mysteries" icon="albums-outline" accent={palette.gold} onPress={() => router.push('/case-files')} wide />
        <ModeCard title="Daily Case" subtitle={dailyComplete ? 'Official result recorded — replay available' : `${daily.title} · same case for every detective`} icon="calendar-outline" accent={dailyComplete ? palette.success : '#8E6FB1'} onPress={() => router.push('/daily')} badge={dailyComplete ? 'Closed' : 'Today'} />
        <ModeCard title="Endless Cases" subtitle="Deterministic replayable mysteries" icon="infinite-outline" accent="#557C78" onPress={() => router.push('/endless')} />
        <ModeCard title="Rapid Deduction" subtitle="Three minutes. Close as many as you can." icon="flash-outline" accent={palette.crimson} onPress={() => router.push('/rapid')} badge={state.bestRapidScore ? `Best ${state.bestRapidScore}` : undefined} />
      </View>

      <SectionTitle action={<Pressable accessibilityRole="button" onPress={() => router.push('/stats')}><Text style={[styles.textAction, { color: palette.gold }]}>Full stats</Text></Pressable>}>Your desk</SectionTitle>
      <View style={styles.metrics}>
        <Metric icon="flame-outline" value={state.currentDailyStreak} label="Day streak" />
        <Metric icon="checkmark-done-outline" value={state.stats.casesSolved} label="Solved" />
        <Metric icon="analytics-outline" value={`${accuracy}%`} label="Accuracy" />
      </View>

      <View style={styles.quickLinks}>
        <QuickLink label="Case Archive" icon="archive-outline" onPress={() => router.push('/archive')} />
        <QuickLink label="Achievements" icon="ribbon-outline" onPress={() => router.push('/achievements')} />
      </View>
    </Screen>
  );
}

function ModeCard({ title, subtitle, icon, accent, onPress, badge, wide }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; accent: string; onPress(): void; badge?: string; wide?: boolean }) {
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`} onPress={() => { feedback.play('tap'); onPress(); }} style={({ pressed }) => [styles.modePress, wide && styles.modeWide, pressed && styles.pressed]}>
      <Card style={[styles.modeCard, { borderTopColor: accent, borderTopWidth: 3 }]}>
        <View style={styles.modeTop}>
          <View style={[styles.modeIcon, { backgroundColor: `${accent}20` }]}><Ionicons name={icon} size={27} color={accent} /></View>
          {badge ? <Badge label={badge} tone="gold" /> : null}
        </View>
        <Text style={[styles.modeTitle, { color: palette.text, fontSize: 18 * scale }]}>{title}</Text>
        <Text style={[styles.modeSubtitle, { color: palette.muted, fontSize: 13 * scale, lineHeight: 19 * scale }]}>{subtitle}</Text>
        <Ionicons name="arrow-forward" size={19} color={palette.gold} style={styles.modeArrow} />
      </Card>
    </Pressable>
  );
}

function QuickLink({ label, icon, onPress }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress(): void }) {
  const palette = usePalette();
  const feedback = useFeedback();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { feedback.play('tap'); onPress(); }} style={({ pressed }) => [styles.quickLink, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.pressed]}>
      <Ionicons name={icon} size={21} color={palette.gold} />
      <Body>{label}</Body>
      <Ionicons name="chevron-forward" size={17} color={palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  homeHeader: { paddingTop: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 62, height: 62, borderRadius: 16 },
  brandCopy: { flex: 1 },
  brandKicker: { letterSpacing: 2, fontWeight: '900', marginBottom: -3 },
  brandTitle: { fontSize: 27, lineHeight: 34 },
  settingsButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  levelCard: { marginTop: 20 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  levelLabel: { letterSpacing: 1.3, fontWeight: '800' },
  levelValue: { fontWeight: '900', marginTop: 2 },
  levelProgressText: { marginTop: 7, textAlign: 'right' },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modePress: { minWidth: 250, flexGrow: 1, flexBasis: '46%' },
  modeWide: { flexBasis: '100%' },
  modeCard: { minHeight: 172, height: '100%' },
  modeTop: { flexDirection: 'row', justifyContent: 'space-between' },
  modeIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeTitle: { fontWeight: '900', marginTop: 15 },
  modeSubtitle: { marginTop: 5, maxWidth: 430 },
  modeArrow: { marginTop: 'auto', alignSelf: 'flex-end' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickLinks: { gap: 10, marginTop: 20 },
  quickLink: { minHeight: 54, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  textAction: { fontWeight: '800', fontSize: 13 },
});
