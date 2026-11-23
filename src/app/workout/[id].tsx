import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Icon, Label, Muted, Panel, ProgressBar, RankBadge, Screen, styles, tap } from '@/components/ui';
import { alternativesFor, formatAmount, getExercise, MUSCLE_LABEL } from '@/data/exercises';
import { getWorkout, RANK_XP, type WorkoutStep } from '@/data/workouts';
import { levelForRank } from '@/engine/leveling';
import { useGame } from '@/store/useGame';
import { colors, rankColor } from '@/theme';

type Phase = 'overview' | 'work' | 'rest' | 'done';

function useTicker(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.max(0, Math.floor(sec % 60))).padStart(2, '0')}`;

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getWorkout(id);
  const level = useGame((s) => s.level);
  const equipment = useGame((s) => s.profile!.equipment);
  const finishWorkout = useGame((s) => s.finishWorkout);

  const [steps, setSteps] = useState<WorkoutStep[]>(workout?.steps ?? []);
  const [swapOpen, setSwapOpen] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('overview');
  const [stepIdx, setStepIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phaseStart, setPhaseStart] = useState(Date.now());
  const [timedRunning, setTimedRunning] = useState(false);
  const startedAt = useRef(0);
  const performed = useRef<Record<string, number>>({});
  const [earned, setEarned] = useState(0);
  const [restFor, setRestFor] = useState(0);
  const now = useTicker(phase === 'rest' || timedRunning || phase === 'work');

  const locked = workout ? level < levelForRank(workout.rank) : true;
  const step = steps[stepIdx];
  const ex = step ? getExercise(step.exerciseId) : null;
  const totalSets = steps.reduce((a, s) => a + s.sets, 0);
  const setsDone = steps.slice(0, stepIdx).reduce((a, s) => a + s.sets, 0) + setIdx;
  const elapsedPhase = (now - phaseStart) / 1000;

  const begin = () => {
    startedAt.current = Date.now();
    performed.current = {};
    setStepIdx(0);
    setSetIdx(0);
    setPhase('work');
    setPhaseStart(Date.now());
  };

  const advance = () => {
    if (!step || !workout) return;
    performed.current[step.exerciseId] = (performed.current[step.exerciseId] ?? 0) + step.amount;
    tap('medium');
    setTimedRunning(false);
    const lastSet = setIdx + 1 >= step.sets;
    const lastStep = stepIdx + 1 >= steps.length;
    if (lastSet && lastStep) {
      const xp = finishWorkout(workout.id, Math.round((Date.now() - startedAt.current) / 1000), performed.current);
      setEarned(xp);
      setPhase('done');
      tap('success');
      return;
    }
    if (lastSet) {
      setStepIdx(stepIdx + 1);
      setSetIdx(0);
    } else {
      setSetIdx(setIdx + 1);
    }
    if (step.restSec > 0) {
      setRestFor(step.restSec);
      setPhase('rest');
      setPhaseStart(Date.now());
    } else {
      setPhase('work');
      setPhaseStart(Date.now());
    }
  };

  // Auto-advance when the rest timer or a timed set runs out.
  const restLeft = restFor - elapsedPhase;
  useEffect(() => {
    if (phase === 'rest' && restLeft <= 0) {
      tap('success');
      setPhase('work');
      setPhaseStart(Date.now());
    }
  }, [phase, restLeft]);

  const timedLeft = ex?.unit === 'sec' && step ? step.amount - (timedRunning ? elapsedPhase : 0) : 0;
  useEffect(() => {
    if (timedRunning && timedLeft <= 0) advance();
  }, [timedRunning, timedLeft]);

  if (!workout) {
    return <Screen><Muted>Workout not found.</Muted></Screen>;
  }

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: workout.name }} />

      {phase === 'overview' && (
        <>
          <Panel>
            <View style={[styles.row, { gap: 12 }]}>
              <RankBadge rank={workout.rank} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '900', fontSize: 20 }}>{workout.name}</Text>
                <Muted>{workout.minutes} min · {workout.focus.map((f) => MUSCLE_LABEL[f]).join(', ')}</Muted>
              </View>
            </View>
            <Muted>{workout.description}</Muted>
            <Text style={{ color: colors.accent, fontWeight: '900' }}>Reward: +{Math.round(RANK_XP[workout.rank] * (1 + level * 0.02))} XP</Text>
          </Panel>

          <Panel title="Exercises" icon="format-list-numbered" right={<Muted style={{ fontSize: 12 }}>Tap ⇄ to swap</Muted>}>
            {steps.map((s, i) => {
              const e = getExercise(s.exerciseId);
              const alts = alternativesFor(s.exerciseId, equipment);
              return (
                <View key={`${s.exerciseId}_${i}`} style={{ gap: 6, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={styles.between}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '800' }}>{e.name}</Text>
                      <Muted style={{ fontSize: 12 }}>
                        {s.sets} × {formatAmount(s.amount, e.unit)}{s.restSec ? ` · rest ${s.restSec}s` : ''}
                      </Muted>
                    </View>
                    {alts.length > 0 && (
                      <Pressable hitSlop={8} onPress={() => setSwapOpen(swapOpen === i ? null : i)} style={{ padding: 6 }}>
                        <Icon name="swap-horizontal" color={colors.primary} />
                      </Pressable>
                    )}
                  </View>
                  {swapOpen === i && (
                    <View style={{ gap: 6 }}>
                      <Label>Same muscle group</Label>
                      {alts.map((a) => (
                        <Button
                          key={a.id}
                          small
                          variant="ghost"
                          label={a.name}
                          onPress={() => {
                            setSteps(steps.map((st, j) => (j === i ? { ...st, exerciseId: a.id } : st)));
                            setSwapOpen(null);
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </Panel>

          {locked ? (
            <Panel tone="danger">
              <Text style={{ color: colors.danger, fontWeight: '900' }}>Locked: requires level {levelForRank(workout.rank)}</Text>
              <Muted>Clear daily quests to level up and unlock {workout.rank}-rank trials.</Muted>
            </Panel>
          ) : (
            <Button label="Start workout" icon="play" variant="accent" onPress={begin} />
          )}
        </>
      )}

      {(phase === 'work' || phase === 'rest') && step && ex && (
        <>
          <View style={{ gap: 6 }}>
            <View style={styles.between}>
              <Label>Set {setsDone + 1} of {totalSets}</Label>
              <Label>{fmtClock((now - startedAt.current) / 1000)}</Label>
            </View>
            <ProgressBar value={setsDone / totalSets} color={rankColor[workout.rank]} />
          </View>

          {phase === 'rest' ? (
            <Panel title="Rest" icon="timer-sand" tone="accent">
              <Text style={{ color: colors.accent, fontSize: 64, fontWeight: '900', textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                {fmtClock(Math.ceil(restLeft))}
              </Text>
              <Muted style={{ textAlign: 'center' }}>Next: {ex.name} — {formatAmount(step.amount, ex.unit)}</Muted>
              <Button label="Skip rest" icon="skip-next" variant="ghost" onPress={() => { setPhase('work'); setPhaseStart(Date.now()); }} />
            </Panel>
          ) : (
            <Panel title={`${ex.name} · set ${setIdx + 1}/${step.sets}`} icon="arm-flex">
              <Text style={{ color: colors.text, fontSize: 56, fontWeight: '900', textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                {ex.unit === 'sec' ? fmtClock(Math.ceil(timedLeft)) : formatAmount(step.amount, ex.unit)}
              </Text>
              <Muted style={{ textAlign: 'center' }}>{ex.cue}</Muted>
              {ex.unit === 'sec' && !timedRunning ? (
                <Button label="Start timer" icon="timer-outline" onPress={() => { setTimedRunning(true); setPhaseStart(Date.now()); }} />
              ) : null}
              <Button label={ex.unit === 'sec' ? 'Finish set early' : 'Set complete'} icon="check" variant="success" onPress={advance} />
            </Panel>
          )}
          <Button label="Abandon workout" variant="ghost" small onPress={() => setPhase('overview')} />
        </>
      )}

      {phase === 'done' && (
        <Panel tone="success">
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
            <Icon name="trophy" size={56} color={colors.accent} />
            <Text style={{ color: colors.text, fontWeight: '900', fontSize: 22 }}>WORKOUT COMPLETE</Text>
            <Text style={{ color: colors.accent, fontWeight: '900', fontSize: 28 }}>+{earned} XP</Text>
            <Muted style={{ textAlign: 'center' }}>Matching reps were added to today's daily quest.</Muted>
          </View>
          <Button label="Back to training" onPress={() => router.back()} />
        </Panel>
      )}
    </Screen>
  );
}
