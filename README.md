<p align="center">
  <img src="assets/icon.png" width="120" alt="Exercise Leveling icon" />
</p>

<h1 align="center">Exercise Leveling</h1>

<p align="center"><b>LEVEL UP YOUR EXERCISE!</b><br/>
A fitness RPG for Android that turns real workouts into daily quests, with a calendar that steadily raises (or lowers) your training intensity based on what you ate.</p>

<p align="center">
  <a href="https://github.com/TamanegiNinja25/ExerciseLeveling/releases/latest"><img alt="Download APK" src="https://img.shields.io/github/v/release/TamanegiNinja25/ExerciseLeveling?label=Download%20APK&color=8B5CF6"></a>
  <a href="https://github.com/TamanegiNinja25/ExerciseLeveling/actions/workflows/android.yml"><img alt="Build" src="https://github.com/TamanegiNinja25/ExerciseLeveling/actions/workflows/android.yml/badge.svg"></a>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-F59E0B">
  <img alt="Expo SDK" src="https://img.shields.io/badge/Expo%20SDK-58-0B0D14">
</p>

---

## ✨ Features

### Core RPG loop
- **Player registration**: a lifestyle questionnaire (body stats, activity, fitness level, goal, equipment, recovery days, reminder time) builds your personal plan.
- **Daily quests**: push-ups, sit-ups, squats, a run, and one goal-specific task, all scaled to your level. Clear them before midnight.
- **XP, levels & ranks**: gain XP and climb from **E-Rank to S-Rank**. Each level gives 3 stat points.
- **Five stats** (STR · AGI · END · VIT · FOC) that grow from the exercises you do, plus points you assign yourself. Your **Power** score sums them up.
- **Penalties**: miss a daily quest and you **lose XP**, your **streak resets**, and the next day spawns a **penalty quest**. Ignore that too and you lose more.
- **Streaks, achievements & titles**: 20 achievements, each worth a stat point, and unlockable titles to show under your name.
- **System log**: level-ups, rank-ups, penalties and achievements, each delivered as a notice.

### Training
- **18 ranked workouts (E → S)** for bodyweight, dumbbells or a full gym. Higher ranks unlock with level.
- **Exercise swap**: replace any movement with another that targets the same muscle group and suits your equipment.
- **Guided session runner**: set tracking, countdowns for timed sets, auto rest timers, and haptics.
- Reps done in workouts **also count toward today's daily quest**.

### 🗓️ Calendar-based progressive intensity (diet-driven)
Each day's quest targets are multiplied by an **intensity** that's fixed when the day starts:

```
intensity = clamp( base × (1 + diet) + penalty , 0.5 , 3.0 )
```

| Component | How it moves |
|---|---|
| **Base progression** | +2% per cleared day, +0.5% per partial day, −3% per missed day (detraining). Floor 1.0×, cap 2.5×. |
| **Diet** (yesterday's food log) | Calorie surplus >115% → up to **+30%** (halved if you're bulking) · under-fuelled <70% → **−15%** for safety · protein goal met → **+5%** · each processed/sugary item → **+3%** (max +15%) · nothing logged → **+5%** |
| **Penalty load** | +0.10× for each missed day in the last 7 (max +0.40×) |

- **Monthly calendar** colour-codes every day (cleared / partial / missed / recovery), shows its multiplier, and marks workouts and penalties.
- **Tomorrow's forecast** shows the intensity you'll get if you clear today vs. if you miss it, and updates live as you log meals.
- **Day report**: tap any date for its intensity breakdown, quest log, penalty quest, nutrition vs. targets, water and workouts.
- **Monthly summary & intensity trend chart**: clear rate, average intensity, net XP.

### Nutrition ("Fuel")
- Personal **calorie, macro and water targets** (Mifflin–St Jeor BMR × activity × goal).
- **Food log** with 30 built-in foods plus custom entries, each tagged whole / processed / sugary.
- **Water tracker** and **goal-based meal plan** suggestions.
- A live **"tomorrow's intensity impact"** readout.

### Progress
- **Victory photos** from the camera or gallery, copied into app storage and stamped with your level.
- **Body-weight log** with a trend chart (it also updates your calorie targets).
- **Lifetime totals** for every exercise.

### Quality of life
- **Daily reminder** plus a **9 PM deadline warning** (local notifications).
- **Avatar customisation**: colours, plus emblems that unlock with level.
- Works fully **offline**. All data stays on your device (AsyncStorage).

---

## 📲 Install (Android)

1. Open the **[latest release](https://github.com/TamanegiNinja25/ExerciseLeveling/releases/latest)** and download `ExerciseLeveling-vX.Y.Z.apk`.
2. On your phone, allow **Install unknown apps** for your browser or file manager.
3. Open the APK and install it. Android 7.0+ is supported (arm64, armv7, x86_64).

> Unless the repository has release-signing secrets configured, release APKs are signed with the standard React Native debug key. That's fine for sideloading and in-place upgrades, but not for the Play Store. See **Release signing** below.

---

## 🛠️ Development

**Stack:** Expo SDK 58 · React Native 0.88 · React 19 · Expo Router · TypeScript · Zustand (persisted to AsyncStorage) · expo-notifications · expo-image-picker · expo-file-system

**Requirements:** Node **22.13+**, plus JDK 17 and the Android SDK if you build natively.

```bash
npm install
npm start            # Expo dev server (press "w" for web preview)
npm run typecheck    # tsc --noEmit
npm test             # engine unit tests (node:test via tsx)
npm run android      # local native dev build (needs Android SDK)
```

### Build a release APK locally

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

### Project layout

```
src/
  app/                 Expo Router screens
    (tabs)/            Status · Quest · Train · Calendar · Fuel
    workout/[id].tsx   Workout detail + guided session runner
    day/[date].tsx     Calendar day report
    onboarding.tsx     Player registration wizard
    progress.tsx  achievements.tsx  settings.tsx  messages.tsx
  engine/              Pure game rules (no React)
    game.ts            Day lifecycle: ensureDay / closeDay / rollover, quest claims, workouts
    intensity.ts       Progression, diet modifier, penalty load, projections
    leveling.ts        XP curve, ranks, stats
    quests.ts          Daily & penalty quest generation
    nutrition.ts       BMR/TDEE targets, totals, meal plans
    achievements.ts    Achievements & titles
  data/                Exercise catalogue, workouts, food presets
  store/useGame.ts     Zustand store (clone → engine mutation → commit)
  components/          UI kit and TaskRow
tests/engine.test.ts   Engine unit tests
scripts/configure-signing.mjs   Optional CI release signing
```

### CI / Releases

[`.github/workflows/android.yml`](.github/workflows/android.yml) typechecks, tests, and builds the APK on every push and PR, uploading it as a workflow artifact. **Pushing a `v*` tag** publishes a GitHub Release with the APK attached:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

#### Release signing (optional)
Add these repository secrets to sign with your own key:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key password |

> Changing the signing key means users have to uninstall the old build before installing the new one.

---

## ⚠️ Disclaimer

Exercise Leveling is a motivational tool, not medical advice. Check with a healthcare professional before starting a new exercise or diet programme, and stop if you feel pain. The intensity system deliberately **lowers** targets when you under-eat. Listen to your body.

## 📄 License

[MIT](LICENSE) © 2026 TamanegiNinja25

Exercise Leveling is an original, independent project inspired by the general "level up your workouts" fitness-RPG genre. It isn't affiliated with any other app, game or franchise.
