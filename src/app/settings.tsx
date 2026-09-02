import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AppHeader, Body, Button, Card, Divider, Screen, SectionTitle, useTextScale } from '@/components/ui';
import { useGame } from '@/state/game-context';
import { usePalette } from '@/theme';
import type { TextSizePreference, ThemePreference } from '@/types/game';

export default function SettingsScreen() {
  const { state, updateSettings, resetProgress } = useGame();
  const palette = usePalette();
  const scale = useTextScale();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const settings = state.settings;

  const handleReset = async () => {
    setResetting(true);
    setResetError(null);
    try {
      await resetProgress();
      setConfirmReset(false);
    } catch {
      setResetError('Progress could not be erased. Your existing save is still available; please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Settings" subtitle="Comfort, accessibility, and privacy" />
      <SectionTitle>Sound and feel</SectionTitle>
      <Card>
        <ToggleRow icon="volume-high-outline" label="Sound effects" description="Clue, decision, and achievement cues" value={settings.sound} onChange={(sound) => updateSettings({ sound })} />
        <Divider />
        <ToggleRow icon="musical-notes-outline" label="Ambient music" description="Low-volume noir atmosphere" value={settings.music} onChange={(music) => updateSettings({ music })} />
        <Divider />
        <ToggleRow icon="phone-portrait-outline" label="Haptics" description="Light feedback on supported devices" value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />
      </Card>

      <SectionTitle>Appearance</SectionTitle>
      <Card>
        <Text style={[styles.optionLabel, { color: palette.text, fontSize: 15 * scale }]}>Theme</Text>
        <Body muted style={styles.optionDescription}>All themes preserve strong contrast and the noir identity.</Body>
        <Segmented
          value={settings.theme}
          options={[['noir', 'Noir'], ['midnight', 'Midnight'], ['system', 'System']]}
          onChange={(theme) => updateSettings({ theme: theme as ThemePreference })}
        />
        <Divider />
        <Text style={[styles.optionLabel, { color: palette.text, fontSize: 15 * scale }]}>Text size</Text>
        <Body muted style={styles.optionDescription}>Scales headings, clues, labels, and controls.</Body>
        <Segmented
          value={settings.textSize}
          options={[['standard', 'Standard'], ['large', 'Large'], ['extra-large', 'Extra large']]}
          onChange={(textSize) => updateSettings({ textSize: textSize as TextSizePreference })}
        />
        <Divider />
        <ToggleRow icon="accessibility-outline" label="Reduced motion" description="Uses restrained screen transitions and avoids decorative movement" value={settings.reducedMotion} onChange={(reducedMotion) => updateSettings({ reducedMotion })} />
      </Card>

      <SectionTitle>Privacy</SectionTitle>
      <Card>
        <View style={styles.privacyHeading}><Ionicons name="shield-checkmark-outline" size={24} color={palette.success} /><Text style={[styles.optionLabel, { color: palette.text, fontSize: 16 * scale }]}>Guest-first and offline</Text></View>
        <Body muted style={styles.privacyText}>No account is required. Progress and preferences stay on this device. Optional PostHog analytics and Sentry crash reporting are disabled unless the build owner supplies configuration; neither integration is configured to collect sensitive personal information.</Body>
      </Card>

      <SectionTitle>Progress data</SectionTitle>
      <Card style={[confirmReset && { borderColor: palette.crimson }]}>
        {!confirmReset ? (
          <>
            <Body>Reset cases, XP, achievements, streaks, and statistics.</Body>
            <Body muted style={styles.resetNote}>Audio, theme, motion, and text preferences will be kept.</Body>
            <Button label="Reset progress" icon="trash-outline" variant="danger" onPress={() => setConfirmReset(true)} style={styles.resetButton} />
          </>
        ) : (
          <>
            <Text accessibilityLiveRegion="assertive" style={[styles.confirmTitle, { color: palette.crimson, fontSize: 18 * scale }]}>Erase all detective progress?</Text>
            <Body muted>This cannot be undone. Your settings will remain.</Body>
            <View style={styles.confirmActions}>
              <Button label="Cancel" variant="ghost" disabled={resetting} onPress={() => setConfirmReset(false)} style={styles.confirmButton} />
              <Button label={resetting ? 'Erasing…' : 'Erase progress'} variant="danger" disabled={resetting} onPress={handleReset} style={styles.confirmButton} />
            </View>
            {resetError ? <Body style={[styles.resetError, { color: palette.crimson }]}>{resetError}</Body> : null}
          </>
        )}
      </Card>
      <Body muted style={styles.version}>The Last Alibi · Version 1.0.0 · Local save schema 1</Body>
    </Screen>
  );
}

function ToggleRow({ icon, label, description, value, onChange }: { icon: keyof typeof Ionicons.glyphMap; label: string; description: string; value: boolean; onChange(value: boolean): void }) {
  const palette = usePalette();
  const scale = useTextScale();
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, { backgroundColor: `${palette.gold}14` }]}><Ionicons name={icon} size={21} color={palette.gold} /></View>
      <View style={styles.toggleCopy}><Text style={[styles.optionLabel, { color: palette.text, fontSize: 15 * scale }]}>{label}</Text><Text style={[styles.toggleDescription, { color: palette.muted, fontSize: 12 * scale }]}>{description}</Text></View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: palette.borderStrong, true: palette.goldSoft }} thumbColor={value ? palette.gold : palette.muted} />
    </View>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange(value: string): void }) {
  const palette = usePalette();
  return (
    <View style={[styles.segmented, { borderColor: palette.border }]}>
      {options.map(([option, label]) => {
        const selected = option === value;
        return <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onChange(option)} style={[styles.segment, selected && { backgroundColor: palette.elevated }]}><Text style={[styles.segmentText, { color: selected ? palette.gold : palette.muted }]}>{label}</Text></Pressable>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  toggleIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  toggleCopy: { flex: 1 },
  optionLabel: { fontWeight: '800' },
  optionDescription: { marginTop: 4 },
  toggleDescription: { marginTop: 2, lineHeight: 17 },
  segmented: { flexDirection: 'row', padding: 4, borderWidth: 1, borderRadius: 12, marginTop: 12 },
  segment: { flex: 1, minHeight: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  segmentText: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  privacyHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { marginTop: 11 },
  resetNote: { marginTop: 4 },
  resetButton: { marginTop: 16 },
  confirmTitle: { fontWeight: '900', marginBottom: 6 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  confirmButton: { flex: 1 },
  resetError: { marginTop: 12 },
  version: { textAlign: 'center', marginTop: 20, fontSize: 11 },
});

