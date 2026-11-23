# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository, plus a running log of changes.
**Update the Changelog section with every meaningful change.**

@AGENTS.md

## Project snapshot

- **What:** Exercise Leveling, an offline fitness RPG for Android. Daily quests, XP/levels/ranks E→S, stats, penalties, ranked workouts, nutrition logging, and a calendar where each day's training intensity is derived from consistency, the previous day's diet, and recent misses.
- **Stack:** Expo SDK 58, React Native 0.88, React 19.3, Expo Router (`src/app`), TypeScript (strict), Zustand + AsyncStorage persistence.
- **Platforms:** Android is primary (APK via CI). Web runs for previews. iOS is untested.

## Commands

```bash
npm start             # dev server
npm run typecheck     # must pass before committing
npm test              # engine tests (tsx + node:test). Needs Node 22+.
npx expo export --platform web   # quick bundle sanity check without Android SDK
```

The release APK is built in GitHub Actions (`.github/workflows/android.yml`): `expo prebuild` → `./gradlew assembleRelease`. Pushing a `v*` tag publishes a GitHub Release.

## Architecture rules

1. **Game rules live in `src/engine/` and stay React-free.** Engine functions mutate a *draft* `GameData`. The store (`src/store/useGame.ts`) does `structuredClone → engine fn → set()`. Don't put rules in screens.
2. **Engine and data files use relative imports** (not `@/`) so `tsx` tests can run them without path mapping. Screens and components may use `@/`.
3. **Dates are local `YYYY-MM-DD` keys** (`engine/dates.ts`). Never compare `Date` objects directly for day logic.
4. **Day lifecycle:** `ensureDay` fixes a day's intensity and tasks when the day is first created. `closeDay` finalises a past day (partial XP, misses, XP loss, streak, progression). `rollover(today)` runs on launch, on foreground, and at midnight, and back-fills up to 60 unopened days.
5. **Intensity formula:** `clamp(base × (1 + diet) + penalty, 0.5, 3.0)`. Tunables are the exported constants at the top of `engine/intensity.ts` and `engine/game.ts`. If you change them, update the README table and the tests.
6. The **first day (`grace`)** never penalises and ignores the diet modifier.
7. **Persisted state shape** is `GameData` (`engine/types.ts`) under the storage key `exercise-leveling/v1`. If you change the shape incompatibly, bump `version` in the persist options and add a `migrate` function.
8. Native config goes in `app.json` and config plugins. Never commit `android/` or `ios/` (CNG).
9. Content must stay original: no names, characters, art or text from existing franchises.

## Release checklist

1. Bump `expo.version` **and** `expo.android.versionCode` in `app.json`, plus `version` in `package.json`.
2. Update `RELEASE_NOTES.md` and the Changelog below.
3. `npm run typecheck && npm test`
4. Commit, then `git tag vX.Y.Z && git push origin main --tags`.

## Changelog

### v1.0.0 (2026-11-23)
Initial release.
- Expo SDK 58 / Expo Router app scaffold with dark "system window" UI kit and a generated chevron icon set.
- Onboarding questionnaire → profile, calorie/macro/water targets, Day-1 quest preview.
- Daily quest engine: fitness-level and goal-based tasks, intensity scaling, recovery days, quest claiming with XP/stat rewards and streaks.
- Penalty system: XP loss on missed days, penalty quests (half the unfinished work plus burpees), extra loss if the penalty is ignored, 7-day penalty load on intensity.
- Leveling: XP curve `80 + 40L + 5L²`, ranks E(1) D(10) C(20) B(35) A(50) S(70), 3 stat points per level, Power score.
- Calendar tab: month grid by status and intensity, tomorrow's forecast (clear vs. miss), monthly summary, intensity trend. Day report screen with full breakdown.
- Fuel tab: food log (30 presets + custom, whole/processed/sugary tags), macros, water, live diet → intensity impact, goal-based meal plan.
- Train tab: 18 ranked workouts (E→S) with level locks, equipment/muscle filters, same-muscle exercise swap, guided runner with rest timers. Workout reps count toward the daily quest.
- Progress: victory photos (copied into app documents), weight log + chart, lifetime totals.
- 20 achievements with titles, system message log, avatar colour/emblem customisation.
- Local notifications: daily reminder + 9 PM deadline warning.
- CI: typecheck + tests + release APK build, GitHub Release on `v*` tags, optional signing via secrets.
