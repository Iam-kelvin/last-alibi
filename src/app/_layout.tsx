import { DarkTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { initializeObservability, reportError, track } from '@/services/analytics';
import { FeedbackProvider } from '@/services/feedback';
import { GameProvider, useGame } from '@/state/game-context';

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
  return (
    <ThemeProvider value={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: '#12100D', card: '#1B1814', text: '#F3EBDD', border: '#3A3329', primary: '#D2A85D' } }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: state.settings.reducedMotion ? 'none' : 'fade', contentStyle: { backgroundColor: '#12100D' } }} />
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => { reportError(error, { boundary: 'root' }); }, [error]);
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>The case file would not open.</Text>
      <Text style={styles.errorText}>Your saved progress is safe. Try loading this screen again.</Text>
      <Button label="Try again" onPress={retry} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  error: { flex: 1, backgroundColor: '#12100D', padding: 28, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorTitle: { color: '#F3EBDD', fontWeight: '900', fontSize: 24, textAlign: 'center' },
  errorText: { color: '#AAA08F', fontSize: 16, textAlign: 'center', maxWidth: 460 },
});
