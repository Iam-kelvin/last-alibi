import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Body, Card, Divider, EmptyState, Metric, ProgressBar, Screen, SectionTitle, useTextScale } from '@/components/ui';
import { getLevelProgress, getPlayerLevel } from '@/game/progression';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';
import { CASE_TYPES } from '@/types/game';

export default function StatsScreen() {
  const { state } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const stats = state.stats;
  const attempts = stats.casesSolved + stats.totalWrongGuesses;
  const accuracy = attempts ? Math.round((stats.casesSolved / attempts) * 100) : 0;
  const averageSeconds = stats.casesSolved ? Math.round(stats.totalSolveSeconds / stats.casesSolved) : 0;
  const firstTryRate = stats.casesSolved ? Math.round((stats.firstTrySolves / stats.casesSolved) * 100) : 0;
  const level = getPlayerLevel(state.xp);
  const levelProgress = getLevelProgress(state.xp);

  return (
    <Screen>
      <AppHeader title="Detective Stats" subtitle={`Level ${level} · ${state.xp.toLocaleString()} XP`} />
      {stats.casesSolved === 0 ? (
        <EmptyState title="No closed files yet" message="Your accuracy, solve time, and case specialties will appear after your first deduction." />
      ) : (
        <>
          <Card style={styles.levelCard}>
            <View style={styles.levelRow}><View><Text style={[styles.levelCaption, { color: palette.gold }]}>DETECTIVE LEVEL</Text><Text style={[styles.level, { color: palette.text, fontSize: 32 * scale }]}>{level}</Text></View><Ionicons name="shield-half-outline" size={42} color={palette.gold} /></View>
            <ProgressBar value={levelProgress.ratio} accessibilityLabel={`${levelProgress.current} of ${levelProgress.required} XP to next level`} />
            <Body muted style={styles.levelText}>{levelProgress.current.toLocaleString()} / {levelProgress.required.toLocaleString()} XP toward Level {level + 1}</Body>
          </Card>
          <SectionTitle>Performance</SectionTitle>
          <View style={styles.metrics}>
            <Metric icon="checkmark-done-outline" value={stats.casesSolved} label="Cases solved" />
            <Metric icon="analytics-outline" value={`${accuracy}%`} label="Accuracy" />
            <Metric icon="timer-outline" value={formatTime(averageSeconds)} label="Avg solve" />
            <Metric icon="sparkles-outline" value={`${firstTryRate}%`} label="First try" />
            <Metric icon="bulb-outline" value={stats.totalHintsUsed} label="Hints used" />
            <Metric icon="flame-outline" value={state.longestDailyStreak} label="Best streak" />
          </View>
          <SectionTitle>Cases by structure</SectionTitle>
          <Card>
            {CASE_TYPES.map((type, index) => {
              const count = stats.byType[type];
              const max = Math.max(1, ...Object.values(stats.byType));
              return (
                <View key={type}>
                  {index ? <Divider /> : null}
                  <View style={styles.typeRow}><Body>{type}</Body><Text style={[styles.typeCount, { color: palette.gold }]}>{count}</Text></View>
                  <ProgressBar value={count / max} accessibilityLabel={`${count} ${type} cases solved`} />
                </View>
              );
            })}
          </Card>
          <SectionTitle>Mode records</SectionTitle>
          <Card>
            <RecordRow icon="flash-outline" label="Best Rapid Deduction" value={`${state.bestRapidScore.toLocaleString()} pts`} />
            <Divider />
            <RecordRow icon="calendar-outline" label="Daily cases closed" value={Object.keys(state.dailyResults).length.toString()} />
            <Divider />
            <RecordRow icon="flame-outline" label="Current daily streak" value={`${state.currentDailyStreak} days`} />
          </Card>
        </>
      )}
    </Screen>
  );
}

function RecordRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const palette = usePalette();
  return <View style={styles.record}><Ionicons name={icon} size={21} color={palette.gold} /><Body style={styles.recordLabel}>{label}</Body><Body>{value}</Body></View>;
}

function formatTime(seconds: number): string {
  if (!seconds) return '—';
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

const styles = StyleSheet.create({
  levelCard: { marginTop: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  levelCaption: { fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  level: { fontWeight: '900' },
  levelText: { marginTop: 8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeCount: { fontWeight: '900' },
  record: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  recordLabel: { flex: 1 },
});
