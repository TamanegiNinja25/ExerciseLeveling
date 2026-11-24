import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { FlameAura, GlowText } from '@/components/Flame';
import { Button, Chip, Icon, Label, Muted, Panel, ProgressBar, Screen, Stepper, styles } from '@/components/ui';
import { formatAmount, getExercise } from '@/data/exercises';
import { generateDailyTasks } from '@/engine/quests';
import { computeTargets, GOAL_LABEL } from '@/engine/nutrition';
import { WEEKDAY_SHORT, todayKey } from '@/engine/dates';
import type { Activity, Equipment, FitnessLevel, Goal, Profile, Sex } from '@/engine/types';
import { useGame } from '@/store/useGame';
import { colors } from '@/theme';

type Draft = Omit<Profile, 'createdAt'>;

const ACTIVITY: { v: Activity; label: string; desc: string }[] = [
  { v: 'sedentary', label: 'Sedentary', desc: 'Desk job, little exercise' },
  { v: 'light', label: 'Light', desc: 'Exercise 1–3 days/week' },
  { v: 'moderate', label: 'Moderate', desc: 'Exercise 3–5 days/week' },
  { v: 'active', label: 'Active', desc: 'Hard exercise 6–7 days/week' },
  { v: 'very_active', label: 'Very active', desc: 'Physical job + training' },
];

const FITNESS: { v: FitnessLevel; label: string; desc: string }[] = [
  { v: 'beginner', label: 'Beginner', desc: 'Fewer than 10 push-ups in a row' },
  { v: 'intermediate', label: 'Intermediate', desc: '10–30 push-ups, can run 2–3 km' },
  { v: 'advanced', label: 'Advanced', desc: '30+ push-ups, can run 5 km+' },
];

const GOALS: { v: Goal; icon: string }[] = [
  { v: 'lose_fat', icon: 'fire' },
  { v: 'build_muscle', icon: 'arm-flex' },
  { v: 'endurance', icon: 'run-fast' },
  { v: 'general', icon: 'heart-pulse' },
];

const EQUIPMENT: { v: Equipment; label: string; icon: string }[] = [
  { v: 'none', label: 'No equipment', icon: 'home' },
  { v: 'dumbbells', label: 'Dumbbells', icon: 'dumbbell' },
  { v: 'gym', label: 'Full gym', icon: 'weight-lifter' },
];

function Option({ active, title, desc, icon, onPress }: { active: boolean; title: string; desc?: string; icon?: string; onPress: () => void }) {
  return (
    <Button
      label={desc ? `${title} — ${desc}` : title}
      icon={icon ?? (active ? 'check-circle' : 'circle-outline')}
      variant={active ? 'primary' : 'ghost'}
      onPress={onPress}
      style={{ justifyContent: 'flex-start' }}
    />
  );
}

export default function Onboarding() {
  const onboard = useGame((s) => s.onboard);
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Draft>({
    name: '',
    sex: 'male',
    age: 25,
    heightCm: 170,
    weightKg: 70,
    activity: 'light',
    fitness: 'beginner',
    goal: 'general',
    equipment: 'none',
    restDays: [0],
    reminderHour: 7,
    reminderMinute: 0,
  });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setP((prev) => ({ ...prev, [k]: v }));

  const preview = useMemo(() => {
    const full: Profile = { ...p, createdAt: todayKey() };
    return { targets: computeTargets(full), tasks: generateDailyTasks(full, 1, false) };
  }, [p]);

  const STEPS = 6;
  const canNext = step !== 0 || p.name.trim().length > 0;

  const finish = () => {
    onboard({ ...p, name: p.name.trim() });
    router.replace('/');
  };

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Label>Player registration · {step + 1}/{STEPS}</Label>
        <ProgressBar value={(step + 1) / STEPS} />
      </View>

      {step === 0 && (
        <Panel>
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
            <View style={{ paddingVertical: 20 }}>
              <FlameAura size={72} power={0.8}>
                <Icon name="shield-sword" size={64} color={colors.text} />
              </FlameAura>
            </View>
            <GlowText size={26}>EXERCISE LEVELING</GlowText>
            <Muted style={{ textAlign: 'center' }}>
              Real workouts become quests. Clear your daily quest to gain XP, level up, and raise your rank from E to S.
              Miss it, and the penalty finds you.
            </Muted>
          </View>
          <Label>What should we call you?</Label>
          <TextInput
            style={styles.input}
            placeholder="Player name"
            placeholderTextColor={colors.faint}
            value={p.name}
            onChangeText={(t) => set('name', t)}
            maxLength={20}
            autoFocus
          />
        </Panel>
      )}

      {step === 1 && (
        <Panel title="Body profile" icon="human">
          <Label>Sex (for calorie formulas)</Label>
          <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
            {(['male', 'female', 'other'] as Sex[]).map((s) => (
              <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} active={p.sex === s} onPress={() => set('sex', s)} />
            ))}
          </View>
          <View style={styles.between}><Label>Age</Label><Stepper value={p.age} min={13} onChange={(v) => set('age', v)} /></View>
          <View style={styles.between}><Label>Height</Label><Stepper value={p.heightCm} min={120} onChange={(v) => set('heightCm', v)} format={(v) => `${v} cm`} /></View>
          <View style={styles.between}><Label>Weight</Label><Stepper value={p.weightKg} min={30} step={0.5} onChange={(v) => set('weightKg', v)} format={(v) => `${v} kg`} /></View>
        </Panel>
      )}

      {step === 2 && (
        <>
          <Panel title="Daily activity" icon="walk">
            {ACTIVITY.map((a) => (
              <Option key={a.v} active={p.activity === a.v} title={a.label} desc={a.desc} onPress={() => set('activity', a.v)} />
            ))}
          </Panel>
          <Panel title="Current fitness" icon="arm-flex">
            {FITNESS.map((f) => (
              <Option key={f.v} active={p.fitness === f.v} title={f.label} desc={f.desc} onPress={() => set('fitness', f.v)} />
            ))}
          </Panel>
        </>
      )}

      {step === 3 && (
        <>
          <Panel title="Primary goal" icon="target">
            {GOALS.map((g) => (
              <Option key={g.v} active={p.goal === g.v} title={GOAL_LABEL[g.v]} icon={g.icon} onPress={() => set('goal', g.v)} />
            ))}
          </Panel>
          <Panel title="Equipment" icon="dumbbell">
            {EQUIPMENT.map((e) => (
              <Option key={e.v} active={p.equipment === e.v} title={e.label} icon={e.icon} onPress={() => set('equipment', e.v)} />
            ))}
          </Panel>
        </>
      )}

      {step === 4 && (
        <Panel title="Schedule" icon="calendar-clock">
          <Label>Recovery days (light quest, no penalty risk)</Label>
          <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
            {WEEKDAY_SHORT.map((d, i) => (
              <Chip
                key={d}
                label={d}
                active={p.restDays.includes(i)}
                color={colors.info}
                onPress={() => set('restDays', p.restDays.includes(i) ? p.restDays.filter((x) => x !== i) : [...p.restDays, i])}
              />
            ))}
          </View>
          <View style={styles.between}>
            <Label>Daily reminder</Label>
            <View style={[styles.row, { gap: 6 }]}>
              <Stepper value={p.reminderHour} min={0} onChange={(v) => set('reminderHour', v % 24)} format={(v) => `${String(v).padStart(2, '0')}h`} />
              <Stepper value={p.reminderMinute} min={0} step={15} onChange={(v) => set('reminderMinute', v % 60)} format={(v) => `${String(v).padStart(2, '0')}m`} />
            </View>
          </View>
        </Panel>
      )}

      {step === 5 && (
        <>
          <Panel title="Your plan" icon="clipboard-check" tone="success">
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
              {p.name}, E-Rank · Level 1
            </Text>
            <Muted>
              Goal: {GOAL_LABEL[p.goal]} · {preview.targets.kcal} kcal/day · {preview.targets.protein} g protein · {(preview.targets.waterMl / 1000).toFixed(1)} L water
            </Muted>
          </Panel>
          <Panel title="Day-1 daily quest (1.00×)" icon="sword-cross">
            {preview.tasks.map((t) => (
              <View key={t.id} style={styles.between}>
                <Text style={styles.text}>{getExercise(t.exerciseId).name}</Text>
                <Text style={[styles.text, { fontWeight: '800' }]}>{formatAmount(t.target, t.unit)}</Text>
              </View>
            ))}
          </Panel>
          <Panel title="How intensity works" icon="chart-line" tone="accent">
            <Muted>
              • Every cleared day raises your base intensity by 2%, so targets grow gradually.{'\n'}
              • Yesterday's diet adjusts today's intensity: a calorie surplus or junk food makes it harder; under-eating makes it easier for safety.{'\n'}
              • Missing a day costs XP, adds a penalty quest, and raises intensity for a week.{'\n'}
              • Track all of it on the Calendar tab.
            </Muted>
          </Panel>
        </>
      )}

      <View style={[styles.row, { gap: 10 }]}>
        {step > 0 && <Button label="Back" variant="ghost" onPress={() => setStep(step - 1)} style={{ flex: 1 }} />}
        {step < STEPS - 1 ? (
          <Button label="Next" icon="arrow-right" disabled={!canNext} onPress={() => setStep(step + 1)} style={{ flex: 2 }} />
        ) : (
          <Button label="Begin training" icon="sword" variant="accent" onPress={finish} style={{ flex: 2 }} />
        )}
      </View>
    </Screen>
  );
}
