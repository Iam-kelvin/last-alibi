import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFeedback } from '@/services/feedback';
import { useGame } from '@/state/game-context';
import { textScale, usePalette } from '@/theme';

export function Screen({ children, scroll = true, contentStyle }: PropsWithChildren<{ scroll?: boolean; contentStyle?: StyleProp<ViewStyle> }>) {
  const palette = usePalette();
  const body = <View style={[styles.screenContent, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom', 'left', 'right']}>
      <View pointerEvents="none" style={styles.atmosphere}>
        <LinearGradient colors={[`${palette.gold}14`, 'transparent', `${palette.crimson}0D`]} style={StyleSheet.absoluteFill} />
      </View>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{body}</ScrollView> : body}
    </SafeAreaView>
  );
}

export function AppHeader({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => {
            feedback.play('tap');
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }}
          style={({ pressed }) => [styles.iconButton, { borderColor: palette.border }, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" color={palette.text} size={22} />
        </Pressable>
      ) : <View style={styles.iconSpacer} />}
      <View style={styles.headerCopy}>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: palette.text, fontSize: 18 * scale }]}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={[styles.headerSubtitle, { color: palette.muted, fontSize: 12 * scale }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  const palette = usePalette();
  const scale = useTextScale();
  return <Text style={[styles.eyebrow, { color: palette.gold, fontSize: 11 * scale }]}>{children}</Text>;
}

export function Title({ children, style }: PropsWithChildren<{ style?: StyleProp<TextStyle> }>) {
  const palette = usePalette();
  const scale = useTextScale();
  const custom = StyleSheet.flatten(style);
  const baseFontSize = custom?.fontSize ?? 32;
  const baseLineHeight = custom?.lineHeight ?? Math.ceil(baseFontSize * 1.2);
  return <Text style={[styles.title, style, { color: palette.text, fontSize: baseFontSize * scale, lineHeight: baseLineHeight * scale }]}>{children}</Text>;
}

export function Body({ children, muted = false, style }: PropsWithChildren<{ muted?: boolean; style?: StyleProp<TextStyle> }>) {
  const palette = usePalette();
  const scale = useTextScale();
  const custom = StyleSheet.flatten(style);
  const baseFontSize = custom?.fontSize ?? 15;
  const baseLineHeight = custom?.lineHeight ?? Math.ceil(baseFontSize * 1.53);
  return <Text style={[styles.body, style, { color: custom?.color ?? (muted ? palette.muted : palette.text), fontSize: baseFontSize * scale, lineHeight: baseLineHeight * scale }]}>{children}</Text>;
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  const palette = usePalette();
  const scale = useTextScale();
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: palette.text, fontSize: 19 * scale }]}>{children}</Text>
      {action}
    </View>
  );
}

export function Card({ children, style, paper = false, accessibilityLabel }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; paper?: boolean; accessibilityLabel?: string }>) {
  const palette = usePalette();
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: paper ? palette.paper : palette.surface,
          borderColor: paper ? palette.goldSoft : palette.border,
          shadowColor: palette.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  compact = false,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress(): void;
  variant?: ButtonVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  compact?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const scale = useTextScale();
  const feedback = useFeedback();
  const colors: Record<ButtonVariant, { background: string; border: string; text: string }> = {
    primary: { background: palette.gold, border: palette.gold, text: palette.paperText },
    secondary: { background: palette.elevated, border: palette.borderStrong, text: palette.text },
    danger: { background: palette.paperAccent, border: palette.paperAccent, text: '#FFF8F2' },
    ghost: { background: 'transparent', border: palette.border, text: palette.muted },
  };
  const color = colors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={() => { feedback.play('tap'); onPress(); }}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.buttonCompact : styles.buttonRegular,
        { backgroundColor: color.background, borderColor: color.border, opacity: disabled ? 0.45 : 1 },
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} color={color.text} size={compact ? 16 : 19} /> : null}
      <Text style={[styles.buttonText, { color: color.text, fontSize: (compact ? 13 : 15) * scale }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'neutral', onPaper = false }: { label: string; tone?: 'neutral' | 'gold' | 'success' | 'danger'; onPaper?: boolean }) {
  const palette = usePalette();
  const scale = useTextScale();
  const color = onPaper
    ? tone === 'success' ? '#315E3C' : tone === 'gold' ? '#694A14' : tone === 'danger' ? palette.paperAccent : '#554A3B'
    : tone === 'gold' ? palette.gold : tone === 'success' ? palette.success : tone === 'danger' ? palette.crimson : palette.muted;
  return (
    <View style={[styles.badge, { borderColor: `${color}88`, backgroundColor: `${color}16` }]}>
      <Text style={[styles.badgeText, { color, fontSize: 10 * scale }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ value, accessibilityLabel }: { value: number; accessibilityLabel: string }) {
  const palette = usePalette();
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }} style={[styles.progressTrack, { backgroundColor: palette.border }]}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%`, backgroundColor: palette.gold }]} />
    </View>
  );
}

export function Metric({ value, label, icon }: { value: string | number; label: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const palette = usePalette();
  const scale = useTextScale();
  return (
    <View style={[styles.metric, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      {icon ? <Ionicons name={icon} size={17} color={palette.gold} /> : null}
      <Text style={[styles.metricValue, { color: palette.text, fontSize: 19 * scale }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: palette.muted, fontSize: 10 * scale }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, action }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string; action?: ReactNode }) {
  const palette = usePalette();
  return (
    <Card style={styles.empty}>
      <Ionicons name={icon} size={36} color={palette.gold} />
      <SectionTitle>{title}</SectionTitle>
      <Body muted style={styles.centerText}>{message}</Body>
      {action}
    </Card>
  );
}

export function LoadingState({ label = 'Opening the case file…' }: { label?: string }) {
  const palette = usePalette();
  return (
    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={palette.gold} size="large" />
      <Body muted>{label}</Body>
    </View>
  );
}

export function Divider() {
  const palette = usePalette();
  return <View style={[styles.divider, { backgroundColor: palette.border }]} />;
}

export function useTextScale(): number {
  const { state } = useGame();
  return textScale(state.settings.textSize);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  atmosphere: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  scroll: { flexGrow: 1, alignItems: 'center' },
  screenContent: { width: '100%', maxWidth: 920, flexGrow: 1, paddingHorizontal: 18, paddingBottom: 36 },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44 },
  headerCopy: { flex: 1 },
  headerTitle: { fontWeight: '800', letterSpacing: 0.2 },
  headerSubtitle: { marginTop: 2 },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 2.2, fontWeight: '800', marginBottom: 7 },
  title: { fontWeight: '900', letterSpacing: -0.8 },
  body: { fontWeight: '400' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 22, marginBottom: 11 },
  sectionTitle: { fontWeight: '800', letterSpacing: 0.1, flexShrink: 1 },
  card: {
    borderWidth: 1, borderRadius: 16, padding: 16,
    ...Platform.select({ web: { boxShadow: '0 10px 30px rgba(0,0,0,0.16)' }, default: { shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 3 } }),
  },
  button: { minHeight: 44, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonRegular: { paddingHorizontal: 20, paddingVertical: 13 },
  buttonCompact: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 44 },
  buttonText: { fontWeight: '800', letterSpacing: 0.2, textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, minHeight: 28, justifyContent: 'center', alignSelf: 'flex-start' },
  badgeText: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  metric: { minWidth: 92, flex: 1, padding: 13, borderRadius: 13, borderWidth: 1, gap: 2 },
  metricValue: { fontWeight: '900' },
  metricLabel: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  empty: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 40 },
  centerText: { textAlign: 'center', maxWidth: 440 },
  loading: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', gap: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
});

