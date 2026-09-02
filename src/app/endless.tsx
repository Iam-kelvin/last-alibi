import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Badge, Body, Button, Card, Eyebrow, Screen, Title, useTextScale } from '@/components/ui';
import { CHAPTERS } from '@/data/chapters';
import { generateUnlockedCase } from '@/game/generator';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

export default function EndlessScreen() {
  const { state } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const seed = `endless-${state.endlessCounter}`;
  const unlockedDifficulties = CHAPTERS.filter((chapter) => state.unlockedChapterIds.includes(chapter.id)).map((chapter) => chapter.difficulty);
  const caseFile = generateUnlockedCase(seed, unlockedDifficulties);

  return (
    <Screen>
      <AppHeader title="Endless Cases" subtitle={`${state.endlessCounter} generated files opened`} />
      <View style={styles.hero}>
        <View style={[styles.icon, { borderColor: palette.goldSoft, backgroundColor: `${palette.gold}16` }]}><Ionicons name="infinite" color={palette.gold} size={48} /></View>
        <Eyebrow>Deterministic case generator</Eyebrow>
        <Title style={styles.center}>A new contradiction awaits.</Title>
        <Body muted style={styles.center}>Each file is built from tested logic templates and rejected unless it has exactly one derivable solution.</Body>
      </View>
      <Card paper style={styles.preview}>
        <View style={styles.previewTop}>
          <View style={styles.previewCopy}>
            <Text style={[styles.nextLabel, { color: palette.paperAccent, fontSize: 11 * scale }]}>NEXT FILE</Text>
            <Text style={[styles.nextTitle, { color: palette.paperText, fontSize: 23 * scale }]}>{caseFile.title}</Text>
            <Text style={[styles.nextLocation, { color: palette.paperText, fontSize: 13 * scale }]}>{caseFile.location}</Text>
          </View>
          <Ionicons name="folder-open-outline" size={38} color={palette.paperAccent} />
        </View>
        <View style={styles.badges}><Badge label={caseFile.difficulty} tone="danger" onPaper /><Badge label={caseFile.type} onPaper /></View>
        <Text style={[styles.previewIntro, { color: palette.paperText, fontSize: 15 * scale, lineHeight: 23 * scale }]}>{caseFile.introduction}</Text>
      </Card>
      <Button label="Open endless case" icon="arrow-forward" onPress={() => router.push({ pathname: '/case/[id]', params: { id: caseFile.id, mode: 'endless', seed } })} style={styles.start} />
      <Body muted style={styles.note}>Generated files work offline. Their seed is kept in the route so any case can be reproduced while debugging.</Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 30 },
  icon: { width: 92, height: 92, borderRadius: 46, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  center: { textAlign: 'center', maxWidth: 640, marginTop: 10 },
  preview: { marginTop: 6 },
  previewTop: { flexDirection: 'row', gap: 12 },
  previewCopy: { flex: 1 },
  nextLabel: { fontWeight: '900', letterSpacing: 1.6 },
  nextTitle: { fontWeight: '900', marginTop: 5 },
  nextLocation: { marginTop: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 14 },
  previewIntro: { fontWeight: '500' },
  start: { marginTop: 18 },
  note: { textAlign: 'center', marginTop: 13 },
});

