import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Badge, Body, Card, ProgressBar, Screen, SectionTitle, useTextScale } from '@/components/ui';
import { CHAPTERS } from '@/data/chapters';
import { CURATED_CASE_MAP } from '@/data/curated-cases';
import { useFeedback } from '@/services/feedback';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

export default function CaseFilesScreen() {
  const { state } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  const curatedSolved = Object.values(state.completedCases).filter((record) => CURATED_CASE_MAP[record.caseId]).length;

  return (
    <Screen>
      <AppHeader title="Case Files" subtitle={`${curatedSolved} of 12 curated cases closed`} />
      <Body muted>Chapters unlock as you close curated cases. Reopen any solved file to improve your best score.</Body>
      {CHAPTERS.map((chapter) => {
        const locked = !state.unlockedChapterIds.includes(chapter.id);
        const solvedInChapter = chapter.caseIds.filter((id) => state.completedCases[id]).length;
        return (
          <View key={chapter.id} style={styles.chapter}>
            <View style={styles.chapterHeading}>
              <View style={[styles.chapterNumber, { backgroundColor: locked ? palette.elevated : palette.gold }]}>
                {locked ? <Ionicons name="lock-closed" color={palette.muted} size={17} /> : <Text style={[styles.chapterNumberText, { color: palette.paperText }]}>{chapter.number}</Text>}
              </View>
              <View style={styles.chapterCopy}>
                <View style={styles.chapterTitleRow}>
                  <Text style={[styles.chapterTitle, { color: locked ? palette.muted : palette.text, fontSize: 20 * scale }]}>{chapter.title}</Text>
                  <Badge label={chapter.difficulty} tone={locked ? 'neutral' : 'gold'} />
                </View>
                <Text style={[styles.chapterSubtitle, { color: palette.muted, fontSize: 13 * scale }]}>{chapter.subtitle}</Text>
              </View>
            </View>
            <ProgressBar value={solvedInChapter / chapter.caseIds.length} accessibilityLabel={`${solvedInChapter} of ${chapter.caseIds.length} cases complete in ${chapter.title}`} />
            {locked ? (
              <Card style={styles.lockedCard}>
                <Ionicons name="lock-closed-outline" size={22} color={palette.muted} />
                <Body muted>Close {chapter.requiredSolved - curatedSolved} more curated {chapter.requiredSolved - curatedSolved === 1 ? 'case' : 'cases'} to unlock.</Body>
              </Card>
            ) : (
              <View style={styles.caseList}>
                {chapter.caseIds.map((caseId, index) => {
                  const caseFile = CURATED_CASE_MAP[caseId]!;
                  const record = state.completedCases[caseId];
                  return (
                    <Pressable
                      key={caseId}
                      accessibilityRole="button"
                      accessibilityLabel={`${caseFile.title}, ${caseFile.type}, ${record ? `closed with ${record.score} points` : 'open case'}`}
                      onPress={() => {
                        feedback.play('tap');
                        router.push({ pathname: '/case/[id]', params: { id: caseId, mode: 'case-files' } });
                      }}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <Card style={styles.caseCard}>
                        <View style={[styles.caseIndex, { borderColor: record ? palette.success : palette.borderStrong }]}>
                          {record ? <Ionicons name="checkmark" size={20} color={palette.success} /> : <Text style={[styles.caseIndexText, { color: palette.gold }]}>{chapter.number}.{index + 1}</Text>}
                        </View>
                        <View style={styles.caseCopy}>
                          <Text style={[styles.caseTitle, { color: palette.text, fontSize: 16 * scale }]}>{caseFile.title}</Text>
                          <Text style={[styles.caseMeta, { color: palette.muted, fontSize: 12 * scale }]}>{caseFile.location} Â· {caseFile.type}</Text>
                          {record ? <Text style={[styles.bestScore, { color: palette.success, fontSize: 11 * scale }]}>BEST {record.score.toLocaleString()} PTS</Text> : null}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={palette.muted} />
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
      <SectionTitle>Looking for every file?</SectionTitle>
      <Pressable accessibilityRole="button" onPress={() => router.push('/archive')} style={({ pressed }) => pressed && styles.pressed}>
        <Card style={styles.archiveLink}>
          <Ionicons name="archive-outline" size={24} color={palette.gold} />
          <Body>Open the complete case archive</Body>
          <Ionicons name="arrow-forward" size={19} color={palette.gold} />
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chapter: { marginTop: 26 },
  chapterHeading: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 13 },
  chapterNumber: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chapterNumberText: { fontWeight: '900', fontSize: 17 },
  chapterCopy: { flex: 1 },
  chapterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap' },
  chapterTitle: { fontWeight: '900' },
  chapterSubtitle: { marginTop: 3 },
  lockedCard: { marginTop: 12, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12 },
  caseList: { gap: 10, marginTop: 12 },
  caseCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13 },
  caseIndex: { width: 43, height: 43, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  caseIndexText: { fontWeight: '900', fontSize: 12 },
  caseCopy: { flex: 1 },
  caseTitle: { fontWeight: '800' },
  caseMeta: { marginTop: 3 },
  bestScore: { marginTop: 5, fontWeight: '800', letterSpacing: 0.8 },
  pressed: { opacity: 0.7 },
  archiveLink: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

