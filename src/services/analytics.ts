import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';

export type AnalyticsEvent =
  | 'app_opened'
  | 'tutorial_started'
  | 'tutorial_completed'
  | 'case_started'
  | 'case_completed'
  | 'case_failed'
  | 'wrong_guess'
  | 'hint_used'
  | 'evidence_opened'
  | 'suspect_selected'
  | 'daily_started'
  | 'daily_completed'
  | 'rapid_started'
  | 'rapid_completed'
  | 'achievement_unlocked';

let posthog: PostHog | null = null;
let initialized = false;

export function initializeObservability(): void {
  if (initialized) return;
  initialized = true;

  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({ dsn: sentryDsn, enableNative: true, sendDefaultPii: false });
  }

  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (posthogKey) {
    posthog = new PostHog(posthogKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      enableSessionReplay: false,
    });
  }
}

export function track(event: AnalyticsEvent, properties: Record<string, string | number | boolean> = {}): void {
  posthog?.capture(event, properties);
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  if (context) Sentry.setContext('last_alibi', context);
  Sentry.captureException(error);
  if (__DEV__) console.error(error);
}
