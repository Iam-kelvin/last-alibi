import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader, Body, Card, ProgressBar, Screen, useTextScale } from '@/components/ui';
import { ACHIEVEMENTS } from '@/game/achievements';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';

export default function AchievementsScreen() {
  const { state } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const unlockedCount = ACHIEVEMENTS.filter((item) => state.unlockedAchievements[item.id]).length;

  return (
    <Screen>
      <AppHeader title="Achievements" subtitle={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`} />
      <ProgressBar value={unlockedCount / ACHIEVEMENTS.length} accessibilityLabel={`${unlockedCount} of ${ACHIEVEMENTS.length} achievements unlocked`} />
      <View style={styles.grid}>
        {ACHIEVEMENTS.map((achievement) => {
          const unlockedAt = state.unlockedAchievements[achievement.id];
          return (
            <Card key={achievement.id} style={[styles.achievement, !unlockedAt && styles.locked, unlockedAt && { borderColor: palette.goldSoft }]}>
              <View style={[styles.medal, { backgroundColor: unlockedAt ? `${palette.gold}22` : palette.elevated, borderColor: unlockedAt ? palette.gold : palette.border }]}>
                {unlockedAt ? <Text style={[styles.medalText, { color: palette.gold, fontSize: achievement.icon.length > 2 ? 14 : 22 }]}>{achievement.icon}</Text> : <Ionicons name="lock-closed" size={19} color={palette.muted} />}
              </View>
              <Text style={[styles.title, { color: unlockedAt ? palette.text : palette.muted, fontSize: 16 * scale }]}>{achievement.title}</Text>
              <Body muted style={styles.description}>{achievement.description}</Body>
              <Text style={[styles.status, { color: unlockedAt ? palette.success : palette.muted }]}>{unlockedAt ? `UNLOCKED ${new Date(unlockedAt).toLocaleDateString()}` : 'LOCKED'}</Text>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  achievement: { flexGrow: 1, flexBasis: '45%', minWidth: 250, minHeight: 190 },
  locked: { opacity: 0.66 },
  medal: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  medalText: { fontWeight: '900' },
  title: { fontWeight: '900' },
  description: { marginTop: 6, fontSize: 13, lineHeight: 19 },
  status: { marginTop: 'auto', paddingTop: 15, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
