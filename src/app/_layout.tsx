import { DarkTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingState, Screen } from '@/components/ui';
import { initializeObservability, reportError, track } from '@/services/analytics';
import { FeedbackProvider } from '@/services/feedback';
import { GameProvider, useGame } from '@/state/game-context';
import { DAYLIGHT, usePalette } from '@/theme';

initializeObservability();

export default function RootLayout() {
  useEffect(() => {
    track('app_opened');
    if (Platform.OS === 'web' && 'serviceWorker' in navigator && !__DEV__) {
      navigator.serviceWorker.register('/sw.js').catch((error) => reportError(error, { operation: 'service_worker_registration' }));
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <GameProvider>
          <FeedbackProvider>
            <AppNavigator />
          </FeedbackProvider>
        </GameProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { state } = useGame();
  const palette = usePalette();
  if (!state.hydrated) {
    return <Screen scroll={false}><LoadingState label="Restoring your case files…" /></Screen>;
  }
  return (
    <ThemeProvider value={{ ...DarkTheme, dark: palette !== DAYLIGHT, colors: { ...DarkTheme.colors, background: palette.background, card: palette.surface, text: palette.text, border: palette.border, primary: palette.gold } }}>
      <StatusBar style={palette === DAYLIGHT ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, animation: state.settings.reducedMotion ? 'none' : 'fade', contentStyle: { backgroundColor: palette.background } }} />
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => { reportError(error, { boundary: 'root' }); }, [error]);
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>The case file would not open.</Text>
      <Text style={styles.errorText}>Your saved progress is safe. Try loading this screen again.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={retry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.retryPressed]}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  error: { flex: 1, backgroundColor: '#12100D', padding: 28, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorTitle: { color: '#F3EBDD', fontWeight: '900', fontSize: 24, textAlign: 'center' },
  errorText: { color: '#AAA08F', fontSize: 16, textAlign: 'center', maxWidth: 460 },
  retryButton: { minHeight: 48, minWidth: 150, borderRadius: 12, backgroundColor: '#D2A85D', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  retryPressed: { opacity: 0.72 },
  retryText: { color: '#211B15', fontSize: 15, fontWeight: '800' },
});
