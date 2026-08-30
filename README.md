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

- Node.js `20.19.4+`, `22.13.0+`, or a newer supported LTS release
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

Deploy the generated `dist/` directory to any HTTPS static host. Configure the host to serve clean `.html` routes or fall back unknown routes to `index.html`. The included `manifest.json` and `sw.js` are copied from `public/`; the service worker precaches the generated app shell and caches same-origin assets as they are used.

For a local production preview:

```bash
npx serve@latest dist
```

Service workers require HTTPS in production and are enabled on localhost for development previews.

## Android builds

`app.json` defines the Android application ID as `com.lastalibi.game`. Build profiles live in `eas.json`:

To create a directly installable APK locally, install JDK 17+ plus Android SDK API 36, Build Tools 36.0.0, and NDK 27.1.12297006, then set `JAVA_HOME` and `ANDROID_HOME` and run:

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
