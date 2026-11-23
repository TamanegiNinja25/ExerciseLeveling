import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatAmount, getExercise } from '../data/exercises';
import type { QuestTask, Unit } from '../engine/types';
import { colors } from '../theme';
import { Icon, Muted, ProgressBar, Stepper, styles, tap } from './ui';

const STEP: Record<Unit, number> = { reps: 1, sec: 5, km: 0.1, min: 1 };
const QUICK: Record<Unit, number> = { reps: 5, sec: 15, km: 0.5, min: 5 };

export function TaskRow({ task, onChange, locked, penalty }: {
  task: QuestTask;
  onChange: (done: number) => void;
  locked?: boolean;
  penalty?: boolean;
}) {
  const done = task.done >= task.target;
  const tint = penalty ? colors.danger : done ? colors.success : colors.primary;
  const ex = getExercise(task.exerciseId);
  // Finished tasks fold their controls away; tap the row to adjust anyway.
  const [expanded, setExpanded] = useState(false);
  const showControls = !locked && (!done || expanded);

  return (
    <View style={{ gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable disabled={locked || !done} onPress={() => setExpanded(!expanded)} style={styles.between}>
        <View style={[styles.row, { gap: 8, flex: 1 }]}>
          <Icon name={done ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} color={tint} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{task.label}</Text>
            {!done && <Muted style={{ fontSize: 12 }}>{ex.cue}</Muted>}
          </View>
        </View>
        <Text style={{ color: done ? colors.success : colors.text, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatAmount(task.done, task.unit)} / {formatAmount(task.target, task.unit)}
        </Text>
      </Pressable>
      <ProgressBar value={task.done / task.target} color={tint} height={6} />
      {showControls && (
        <View style={styles.between}>
          <Stepper value={task.done} step={STEP[task.unit]} onChange={onChange} format={(v) => formatAmount(v, task.unit)} />
          <View style={[styles.row, { gap: 6 }]}>
            <Pressable onPress={() => { tap(); onChange(Math.round((task.done + QUICK[task.unit]) * 10) / 10); }} style={chip}>
              <Text style={chipText}>+{formatAmount(QUICK[task.unit], task.unit)}</Text>
            </Pressable>
            <Pressable onPress={() => { tap('success'); onChange(task.target); }} style={[chip, { borderColor: tint }]}>
              <Text style={[chipText, { color: tint }]}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const chip = {
  paddingHorizontal: 10,
  paddingVertical: 7,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.borderHi,
  backgroundColor: colors.panelHi,
} as const;
const chipText = { color: colors.text, fontWeight: '800', fontSize: 13 } as const;
