# Common Requirements

## Stack
- Expo + React Native + TypeScript
- Expo Router
- npm
- Android app
- Web/PWA version
- No native iOS app for now

## Core Rules
- Each game is a completely separate project.
- Core gameplay must work offline.
- Guest play first; accounts are optional.
- Use Supabase only if the game needs cloud saves, leaderboards, remote daily challenges, or similar online features.
- Use PostHog for analytics.
- Use Sentry for crashes/errors.
- Keep ads separate from gameplay logic.
- Rewarded ads preferred; interstitials should be limited.
- One-time Remove Ads purchase can be added on Android.

## Quality
- Fast, responsive, polished UI.
- Mobile-first and thumb-friendly.
- Responsive web layout.
- Sound, haptics, settings, accessibility, and reduced-motion support.
- Each game must have its own visual identity.

## Production Standard
Codex must build a complete game, not a prototype.

Required:
- Complete gameplay loop
- Tutorial/onboarding
- Difficulty/progression
- Save/load progress
- Offline support
- Android-ready build
- Responsive web/PWA
- Error/loading/empty states
- No dead buttons or placeholder screens
- No hard-coded secrets
- .env.example when environment variables are used
- Lint and TypeScript checks passing
- Tests for core game logic
- Puzzle validation tests where applicable
- README with setup, run, test, build, and deploy instructions
- No unfinished TODOs in core functionality
