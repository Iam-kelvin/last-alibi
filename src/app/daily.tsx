import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Badge, Body, Button, Card, Divider, Eyebrow, Screen, SectionTitle, Title, useTextScale } from '@/components/ui';
import { getDailyCase } from '@/game/daily';
import { getLocalDateKey } from '@/game/progression';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

export default function DailyScreen() {
  const { state } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const dateKey = getLocalDateKey();
  const caseFile = getDailyCase(dateKey);
  const official = state.dailyResults[dateKey];

  return (
    <Screen>
      <AppHeader title="Daily Case" subtitle={formatDisplayDate(dateKey)} />
      <View style={styles.hero}>
        <View style={[styles.calendar, { backgroundColor: `${palette.gold}1A`, borderColor: palette.goldSoft }]}>
          <Ionicons name="calendar" size={35} color={palette.gold} />
        </View>
        <Eyebrow>{official ? 'Official result recorded' : 'Todayâ€™s shared mystery'}</Eyebrow>
        <Title style={styles.center}>{caseFile.title}</Title>
        <Body muted style={styles.center}>{caseFile.introduction}</Body>
      </View>
      <View style={styles.badges}>
        <Badge label={caseFile.difficulty} tone="gold" />
        <Badge label={caseFile.type} />
        <Badge label="Offline ready" tone="success" />
      </View>
      {official ? (
        <Card style={[styles.officialCard, { borderColor: palette.success }]}>
          <View style={styles.officialHeading}>
            <Ionicons name="shield-checkmark-outline" size={25} color={palette.success} />
            <SectionTitle>Official score locked</SectionTitle>
          </View>
          <Divider />
          <View style={styles.resultRow}>
            <Result value={official.score.toLocaleString()} label="Score" />
            <Result value={formatTime(official.elapsedSeconds)} label="Time" />
            <Result value={official.firstTry ? 'Yes' : 'No'} label="First try" />
          </View>
          <Body muted style={styles.replayNote}>You can replay freely. Replays never replace the first official result.</Body>
        </Card>
      ) : (
        <Card paper>
          <Text style={[styles.ruleTitle, { color: palette.crimson, fontSize: 12 * scale }]}>DAILY RULE</Text>
          <Text style={[styles.ruleText, { color: palette.paperText, fontSize: 16 * scale, lineHeight: 24 * scale }]}>Your first solve becomes todayâ€™s official score. The date and generator version guarantee the same mystery for every player, even offline.</Text>
        </Card>
      )}
      <Button
        label={official ? 'Replay todayâ€™s case' : 'Start official case'}
        icon={official ? 'refresh' : 'finger-print'}
        onPress={() => router.push({ pathname: '/case/[id]', params: { id: caseFile.id, mode: 'daily', seed: dateKey, dateKey } })}
        style={styles.start}
      />
      <Card style={styles.streakCard}>
        <Ionicons name="flame-outline" size={27} color={palette.gold} />
        <View style={styles.streakCopy}><Text style={[styles.streakValue, { color: palette.text, fontSize: 20 * scale }]}>{state.currentDailyStreak} day streak</Text><Body muted>Longest: {state.longestDailyStreak} days</Body></View>
      </Card>
    </Screen>
  );
}

function Result({ value, label }: { value: string; label: string }) {
  const palette = usePalette();
  return <View style={styles.result}><Text style={[styles.resultValue, { color: palette.text }]}>{value}</Text><Text style={[styles.resultLabel, { color: palette.muted }]}>{label}</Text></View>;
}

function formatDisplayDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year!, month! - 1, day!).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 30 },
  calendar: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  center: { textAlign: 'center', maxWidth: 650, marginTop: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginVertical: 24 },
  officialCard: { marginBottom: 8 },
  officialHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultRow: { flexDirection: 'row' },
  result: { flex: 1, alignItems: 'center' },
  resultValue: { fontSize: 19, fontWeight: '900' },
  resultLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 },
  replayNote: { marginTop: 16, textAlign: 'center' },
  ruleTitle: { fontWeight: '900', letterSpacing: 1.5, marginBottom: 7 },
  ruleText: { fontWeight: '600' },
  start: { marginTop: 18 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 13 },
  streakCopy: { flex: 1 },
  streakValue: { fontWeight: '800' },
});

