# The Last Alibi

The Last Alibi is a production-ready, guest-first deduction mystery game for Android and the web. Players inspect short case files, compare statements with evidence and timelines, mark suspicious details, and identify the one conclusion that cannot be true.

Core play, progression, Daily Cases, generated cases, settings, and statistics work offline. No account or backend is required.

## Included gameplay

- Six Case Files chapters with 12 curated mysteries across Beginner through Master difficulty
- All six case structures: Liar, Broken Alibi, Impossible Evidence, Who Did It?, Timeline, and Missing Detail
- A deterministic offline Daily Case keyed by local calendar date and generator version
- Deterministic Endless Cases with reproducible seeds and logic audits
- Three-minute Rapid Deduction sessions with rising difficulty and a persistent best score
- Escalating hints, retryable wrong guesses, evidence/statement/timeline bookmarks, full solution reasoning, and score breakdowns
- XP, levels, chapter unlocks, Daily streaks, detailed statistics, and 12 achievements
- Local save migration and safe recovery from corrupt data
- Original sound effects, ambient audio, haptics, theme selection, text scaling, reduced motion, and screen-reader labels
- Responsive static web build with a manifest and service-worker app-shell cache

## Requirements

- Node.js `22.13.0+` from the Node 22 LTS line
- npm
- For Android development: Android Studio/emulator or an Android device with Expo Go
- For signed store builds: an Expo account and EAS credentials

The project uses Expo SDK 57, React Native, TypeScript, and Expo Router. iOS is intentionally not configured as a release target.

## Setup

```bash
npm install
```

Optional observability values can be copied from `.env.example` into `.env`. Empty values are safe: analytics and crash uploads remain disabled and the entire game still runs.

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

The game has no application API, database, account service, or server-side secret. All cases, generation, scoring, and saves run on the device. The only optional network services are PostHog analytics and Sentry crash reporting:

| Variable | Required | Value |
| --- | --- | --- |
| `EXPO_PUBLIC_POSTHOG_KEY` | No | PostHog project API key, normally beginning with `phc_` |
| `EXPO_PUBLIC_POSTHOG_HOST` | No | PostHog ingestion URL; defaults to `https://us.i.posthog.com` |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Client DSN from the Sentry project settings |
| `SENTRY_ORG` | No | Sentry organization slug used only for release source-map upload |
| `SENTRY_PROJECT` | No | Sentry project slug used only for release source-map upload |
| `SENTRY_AUTH_TOKEN` | No | Secret Sentry source-map upload token; use only in trusted build CI |
| `SENTRY_DISABLE_AUTO_UPLOAD` | No | Set to `true` for native builds without all three Sentry upload values; local APK scripts do this automatically |

Anything prefixed with `EXPO_PUBLIC_` is compiled into the app and must be treated as public. Never put a private API key or `SENTRY_AUTH_TOKEN` in an `EXPO_PUBLIC_` variable. PostHog and Sentry remain completely disabled when their public key/DSN is empty.

## Run

```bash
# Expo development server
npm start

# Android emulator/device
npm run android

# Browser
npm run web
```

## Quality checks

```bash
npm test
npm run typecheck
npm run lint
npx expo-doctor
```

The test suite covers case parsing and validation, correct-answer handling, ordered hints, scoring, persistence migration, seeded determinism, Daily selection/streaks, progression, achievements, generated-case uniqueness, and generated-case solvability audits.

To validate the Android JavaScript/native asset bundle locally without signing credentials:

```bash
npx expo export --platform android --output-dir dist-android
```

## Web/PWA build and deployment

```bash
npm run build:web
```

Deploy the generated `dist/` directory to any HTTPS static host. Configure the host to serve clean `.html` routes or fall back unknown routes to `index.html`. The included `manifest.json` and `sw.js` are copied from `public/`; the service worker precaches the generated app shell and bundled game assets for offline play.

For a local production preview:

```bash
npx serve@latest dist
```

Service workers require HTTPS in production and are enabled on localhost for development previews.

### Coolify

The recommended Coolify deployment uses the included multi-stage `Dockerfile` and production Nginx configuration:

1. Create an Application from this Git repository and choose **Dockerfile** as the build pack.
2. Set the Dockerfile location to `/Dockerfile`, the base directory to `/`, and the exposed port to `80`.
3. Set the health-check path to `/healthz`.
4. Add the public HTTPS domain. No volume, database, persistent storage, start command, or separate API service is required.
5. Deploy. Nginx serves the static Expo export, handles Expo Router fallback routes, compresses text assets, and applies long-lived caching only to fingerprinted files.

The Docker build pins the Node 22 major line and uses `npm ci`. Coolify does not need a build command or publish-directory override when the Dockerfile build pack is selected.

No environment variables are required. If analytics or crash reporting are wanted, add `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, and/or `EXPO_PUBLIC_SENTRY_DSN` in Coolify and enable **Build Variable** for each one. Expo substitutes these values while creating the browser bundle, so changing them requires a redeploy; runtime-only variables cannot change an already-built static bundle.

The Docker build deliberately does not accept `SENTRY_AUTH_TOKEN` as a build argument because Docker build arguments are not a safe secret transport. Crash reporting still works with the public DSN. Configure `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` in EAS or another trusted CI environment only when source-map upload is required.

For a Coolify Nixpacks static-site deployment instead, set `NIXPACKS_NODE_VERSION=22` as a build variable, use `npm ci` as the install command, `npm run build:web` as the build command, enable **Is it a static site?**, and set the output directory to `dist`. Ensure its Nginx configuration falls back unknown application routes to `/index.html`.

Suggested runtime limits are one shared CPU and 128 MB RAM for the final Nginx container. The Expo build is the heavier phase and should be allowed at least 1 GB RAM. The runtime needs no persistent disk beyond the container image.

## Android builds

`app.json` defines the Android application ID as `com.lastalibi.game`. Build profiles live in `eas.json`:

To create a directly installable APK locally, install JDK 17+ plus Android SDK API 36, Build Tools 36.0.0, and NDK 27.1.12297006, then set `JAVA_HOME` and `ANDROID_HOME`. On Linux/macOS run:

```bash
npx expo prebuild --platform android --no-install
npm run build:apk:linux
```

On Windows PowerShell run:

```powershell
npx expo prebuild --platform android
npm run build:apk
```

The APK is copied to `artifacts/the-last-alibi-v1.0.0.apk`. The local APK targets 64-bit ARM Android devices and is signed with the generated development keystore so it can be installed directly; use EAS-managed production credentials for store distribution.

For remote builds:

```bash
# Internal APK
npm run build:android -- --profile preview

# Play Store AAB
npm run build:android -- --profile production
```

The first remote build asks you to sign in and associate an EAS project. That external project identifier and signing credentials are deliberately not hard-coded in this repository.

## Architecture

```text
src/
  app/          Expo Router screens and mode entry points
  components/   Shared noir UI and the reusable investigation/results loop
  data/         Curated cases and chapter progression
  game/         Validation, generation, scoring, hints, Daily, XP, and achievements
  services/     Analytics/crash, feedback, and isolated monetization adapters
  state/        Local player state, migrations, persistence, and app context
  theme/        Accessible noir/midnight palettes and text scaling
assets/
  audio/        Original generated WAV cues and ambient loop
  images/       Original Last Alibi brand mark
public/         PWA manifest, icon, and service worker
```

Cases are structured data; UI code contains no case-specific answer logic. Every bundled case is validated at module load. Generated cases carry a candidate audit that must prove exactly one answer, consistent evidence, possible distractors, and derivability from the information shown. Invalid cases throw before they can be presented.

The same `seed + generator version` always produces the same generated case. The Daily seed also includes the local `YYYY-MM-DD` date.

## Persistence and privacy

AsyncStorage keeps tutorial state, XP, chapter unlocks, completion records, official Daily results, streaks, achievements, Rapid best score, statistics, Endless position, and settings. Reset Progress erases game progress while keeping accessibility and comfort preferences.

PostHog and Sentry initialize only when their environment variables are supplied. Session replay is disabled, Sentry default PII collection is disabled, and the game does not request or store personal profile data.

## Content and asset maintenance

- Add curated content in `src/data/curated-cases.ts`; the validator runs immediately when the module loads.
- Add or change deterministic templates in `src/game/generator.ts`, and increment `CASE_GENERATOR_VERSION` whenever outputs change.
- Regenerate the original WAV files with `npm run assets:audio`.
- Run all quality checks and both platform exports after content, generator, persistence, or routing changes.

Monetization is intentionally isolated in `src/services/monetization.ts`. The no-op adapter allows future rewarded hints, between-case interstitials, and Remove Ads purchases without coupling any ad SDK to active investigation or scoring logic.
