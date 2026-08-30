import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader, Badge, Body, Card, EmptyState, Screen, useTextScale } from '@/components/ui';
import { CHAPTERS } from '@/data/chapters';
import { CURATED_CASES } from '@/data/curated-cases';
import { useFeedback } from '@/services/feedback';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

type Filter = 'all' | 'closed' | 'open';

export default function ArchiveScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const { state } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  const curatedSolved = CURATED_CASES.filter((caseFile) => state.completedCases[caseFile.id]).length;
  const filtered = CURATED_CASES.filter((caseFile) => filter === 'all' || (filter === 'closed' ? state.completedCases[caseFile.id] : !state.completedCases[caseFile.id]));

  return (
    <Screen>
      <AppHeader title="Case Archive" subtitle={`${curatedSolved} closed Â· ${CURATED_CASES.length - curatedSolved} awaiting`} />
      <View style={styles.filters}>
        {(['all', 'closed', 'open'] as const).map((item) => (
          <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, { borderColor: filter === item ? palette.gold : palette.border, backgroundColor: filter === item ? `${palette.gold}18` : palette.surface }]}>
            <Text style={[styles.filterText, { color: filter === item ? palette.gold : palette.muted, fontSize: 12 * scale }]}>{item === 'all' ? 'ALL FILES' : item === 'closed' ? 'CLOSED' : 'UNSOLVED'}</Text>
          </Pressable>
        ))}
      </View>
      {filtered.length === 0 ? <EmptyState title="No files here" message="Change the archive filter to see other cases." /> : (
        <View style={styles.list}>
          {filtered.map((caseFile) => {
            const chapter = CHAPTERS.find((item) => item.id === caseFile.chapterId)!;
            const chapterUnlocked = state.unlockedChapterIds.includes(chapter.id);
            const record = state.completedCases[caseFile.id];
            return (
              <Pressable
                key={caseFile.id}
                accessibilityRole="button"
                disabled={!chapterUnlocked}
                onPress={() => { feedback.play('tap'); router.push({ pathname: '/case/[id]', params: { id: caseFile.id, mode: 'case-files' } }); }}
                style={({ pressed }) => [!chapterUnlocked && styles.disabled, pressed && styles.pressed]}
              >
                <Card style={styles.file}>
                  <View style={[styles.fileIcon, { backgroundColor: record ? `${palette.success}1D` : palette.elevated }]}>
                    <Ionicons name={!chapterUnlocked ? 'lock-closed' : record ? 'checkmark-done' : 'document-text-outline'} size={23} color={!chapterUnlocked ? palette.muted : record ? palette.success : palette.gold} />
                  </View>
                  <View style={styles.fileCopy}>
                    <View style={styles.fileTitleRow}>
                      <Text style={[styles.fileTitle, { color: palette.text, fontSize: 16 * scale }]}>{caseFile.title}</Text>
                      <Badge label={caseFile.difficulty} />
                    </View>
                    <Text style={[styles.fileMeta, { color: palette.muted, fontSize: 12 * scale }]}>{chapter.title} Â· {caseFile.type}</Text>
                    <Body muted style={styles.fileIntro}>{chapterUnlocked ? caseFile.introduction : `Locked â€” close ${chapter.requiredSolved - curatedSolved} more curated cases.`}</Body>
                    {record ? <Text style={[styles.score, { color: palette.success }]}>Best score {record.score.toLocaleString()}</Text> : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  filter: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontWeight: '800', letterSpacing: 0.8 },
  list: { gap: 11 },
  file: { flexDirection: 'row', gap: 13 },
  fileIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1 },
  fileTitleRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'space-between' },
  fileTitle: { fontWeight: '800', flex: 1 },
  fileMeta: { marginTop: 3 },
  fileIntro: { marginTop: 8, fontSize: 13, lineHeight: 19 },
  score: { fontSize: 11, fontWeight: '800', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.7 },
  disabled: { opacity: 0.58 },
  pressed: { opacity: 0.7 },
});

